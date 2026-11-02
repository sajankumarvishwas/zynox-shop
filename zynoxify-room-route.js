"use strict";

/*
 * Zynoxify "Play together": synchronized listening rooms.
 * - A room has a 4-digit code. Admins control the song, play/pause, seeking and the queue.
 * - Server keeps one shared state; clients follow it (server-sent events down, JSON POSTs up).
 * - Rooms live in memory only and disappear when empty. No accounts needed (nickname only).
 */

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");

const router = express.Router();
const MUSIC_DIR = process.env.ZYNOXIFY_MUSIC_DIR || path.join(__dirname, "public", "assets", "zynoxify", "music");

const LIMITS = { rooms: 200, members: 30, queue: 100 };
const IDLE_ROOM_MS = 10 * 60 * 1000;
const ADMIN_GRACE_MS = 45 * 1000;
const OFFLINE_DROP_MS = 5 * 60 * 1000;
const SHOW_OFFLINE_MS = 90 * 1000;

const rooms = new Map();

/* ---------- helpers ---------- */
function send(res, status, body) {
  return res.status(status).set("Cache-Control", "no-store").set("X-Content-Type-Options", "nosniff").type("application/json").send(JSON.stringify(body));
}
function fail(res, status, code, message) { return send(res, status, { error: { code: code, message: message } }); }
function clip(value, max) { return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max); }
function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 400) return null;
  try { const u = new URL(value); return u.protocol === "https:" ? u.href : null; } catch (_) { return null; }
}
function sha(v) { return crypto.createHash("sha256").update(String(v)).digest(); }
function sameToken(a, b) { return crypto.timingSafeEqual(sha(a), sha(b)); }
function newCode() {
  for (let i = 0; i < 60; i++) {
    const c = String(crypto.randomInt(0, 10000)).padStart(4, "0");
    if (!rooms.has(c)) return c;
  }
  return null;
}
function localExists(file) {
  if (typeof file !== "string" || !file || file.length > 220 || file !== path.basename(file)) return false;
  try { return fs.statSync(path.join(MUSIC_DIR, file)).isFile(); } catch (_) { return false; }
}
function stripTopic(n) { return String(n || "").replace(/\s*-\s*topic$/i, "").replace(/vevo$/i, "").trim(); }
function parseTrack(input) {
  if (!input || typeof input !== "object") return null;
  if (input.kind === "local") return localExists(input.file) ? { kind: "local", file: input.file } : null;
  if (input.kind === "youtube") {
    const id = typeof input.id === "string" ? input.id : "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return { kind: "youtube", id: id, title: clip(input.title, 200), artist: clip(stripTopic(input.artist), 120), artworkUrl: httpsUrl(input.artworkUrl) };
  }
  return null;
}
function trackKey(t) { return t ? (t.kind === "local" ? "local:" + t.file : "yt:" + t.id) : ""; }

/* abuse limits */
const hits = new Map();
function allow(bucket, key, max, windowMs) {
  const k = bucket + "|" + key, now = Date.now();
  if (hits.size > 5000) hits.clear();
  const list = (hits.get(k) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(k, list); return false; }
  list.push(now); hits.set(k, list); return true;
}

function countHits(bucket, key, windowMs) {
  const now = Date.now();
  return (hits.get(bucket + "|" + key) || []).filter((t) => now - t < windowMs).length;
}
function noteHit(bucket, key) {
  const k = bucket + "|" + key;
  const list = hits.get(k) || [];
  list.push(Date.now());
  hits.set(k, list.slice(-100));
}

/* ---------- room model ---------- */
function positionNow(s) { return s.playing ? s.pos + (Date.now() - s.at) / 1000 : s.pos; }
function stateView(r) {
  const s = r.state;
  return { track: s.track, playing: s.playing, pos: s.pos, at: s.at, rev: s.rev, trackRev: s.trackRev, by: s.by, now: Date.now() };
}
function membersView(r) {
  const now = Date.now();
  return Array.from(r.members.values())
    .filter((m) => m.clients.size > 0 || now - m.lastSeen < SHOW_OFFLINE_MS)
    .map((m) => ({ id: m.id, name: m.name, role: m.role, owner: m.id === r.ownerId, online: m.clients.size > 0 }));
}
function write(res, event, data) {
  try { res.write("event: " + event + "\ndata: " + JSON.stringify(data) + "\n\n"); } catch (_) {}
}
function broadcast(r, event, data) {
  r.members.forEach((m) => m.clients.forEach((c) => write(c, event, data)));
}
function pushMembers(r) { broadcast(r, "members", { members: membersView(r), ownerId: r.ownerId }); }
function pushState(r) { broadcast(r, "state", stateView(r)); }
function pushQueue(r) { broadcast(r, "queue", { queue: r.queue }); }

function dropRoom(r, reason) {
  broadcast(r, "closed", { reason: reason || "closed" });
  r.members.forEach((m) => m.clients.forEach((c) => { try { c.end(); } catch (_) {} }));
  rooms.delete(r.code);
}
function newMember(name, role) {
  return { id: crypto.randomBytes(5).toString("hex"), token: crypto.randomBytes(16).toString("base64url"), name: clip(name, 24) || "Guest", role: role, joinedAt: Date.now(), lastSeen: Date.now(), clients: new Set(), ip: "" };
}
function meView(r, m) { return { id: m.id, token: m.token, name: m.name, role: m.role, owner: m.id === r.ownerId, code: r.code }; }
function findMember(r, mid, tok) {
  const m = r.members.get(String(mid || ""));
  return m && typeof tok === "string" && sameToken(m.token, tok) ? m : null;
}
function removeMember(r, m) {
  m.clients.forEach((c) => { try { c.end(); } catch (_) {} });
  r.members.delete(m.id);
  if (!r.members.size) { rooms.delete(r.code); return; }
  if (m.id === r.ownerId) {
    const next = Array.from(r.members.values()).sort((a, b) => (b.role === "admin") - (a.role === "admin") || a.joinedAt - b.joinedAt)[0];
    r.ownerId = next.id; next.role = "admin";
  }
  if (!Array.from(r.members.values()).some((x) => x.role === "admin")) {
    const first = Array.from(r.members.values()).sort((a, b) => a.joinedAt - b.joinedAt)[0];
    first.role = "admin"; r.ownerId = first.id;
  }
  pushMembers(r);
}

/* ---------- request guards ---------- */
router.use((req, res, next) => {
  if (req.method === "GET" || req.method === "HEAD") return next();
  const origin = req.headers.origin;
  if (origin) {
    let ok = false;
    try { ok = new URL(origin).host === req.headers.host; } catch (_) {}
    if (!ok) return fail(res, 403, "bad_origin", "Request blocked.");
  }
  if (!req.is("application/json")) return fail(res, 415, "json_required", "Send JSON.");
  return next();
});

/* ---------- utility routes ---------- */
router.get("/time", (req, res) => send(res, 200, { t: Date.now() }));

router.get("/lan", (req, res) => {
  const urls = [];
  try {
    const nets = os.networkInterfaces();
    Object.keys(nets).forEach((n) => (nets[n] || []).forEach((i) => {
      if (i && i.family === "IPv4" && !i.internal) urls.push("http://" + i.address + ":" + (req.socket.localPort || 3001));
    }));
  } catch (_) { /* some Android versions block this */ }
  send(res, 200, { urls: urls });
});

/* ---------- create / join ---------- */
router.post("/create", (req, res) => {
  if (!allow("create", req.ip, 12, 3600 * 1000)) return fail(res, 429, "rate_limited", "Too many rooms created. Try again later.");
  if (rooms.size >= LIMITS.rooms) return fail(res, 503, "busy", "The server has too many rooms right now.");
  const code = newCode();
  if (!code) return fail(res, 503, "busy", "No free room code. Try again.");
  const admin = newMember((req.body || {}).name, "admin");
  admin.ip = req.ip;
  const r = {
    code: code, ownerId: admin.id, members: new Map(), queue: [], banned: new Set(), createdAt: Date.now(), emptySince: null,
    state: { track: null, playing: false, pos: 0, at: Date.now(), rev: 0, trackRev: 0, by: admin.id }
  };
  r.members.set(admin.id, admin);
  rooms.set(code, r);
  send(res, 201, { me: meView(r, admin) });
});

router.post("/join", (req, res) => {
  const b = req.body || {};
  const code = String(b.code || "").trim();
  if (countHits("joinfail", req.ip, 60 * 1000) >= 20) return fail(res, 429, "rate_limited", "Too many wrong codes. Wait a minute.");
  const r = /^\d{4}$/.test(code) ? rooms.get(code) : null;
  if (!r) { noteHit("joinfail", req.ip); return fail(res, 404, "not_found", "No room with that code. Check the 4 digits."); }
  const back = b.mid ? findMember(r, b.mid, b.token) : null;
  if (back) { back.lastSeen = Date.now(); return send(res, 200, { me: meView(r, back) }); }
  if (r.banned.has(req.ip)) return fail(res, 403, "banned", "You were removed from this room.");
  if (r.members.size >= LIMITS.members) return fail(res, 409, "full", "This room is full.");
  const m = newMember(b.name, "listener");
  m.ip = req.ip;
  r.members.set(m.id, m);
  pushMembers(r);
  send(res, 200, { me: meView(r, m) });
});

/* ---------- live stream ---------- */
router.get("/:code/events", (req, res) => {
  const r = rooms.get(String(req.params.code));
  const m = r ? findMember(r, req.query.mid, req.query.tok) : null;
  if (!r) return fail(res, 404, "not_found", "Room not found.");
  if (!m) return fail(res, 401, "not_member", "You are not in this room.");
  res.status(200);
  res.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-store, no-transform", "Connection": "keep-alive", "X-Accel-Buffering": "no", "X-Content-Type-Options": "nosniff" });
  if (req.socket && req.socket.setTimeout) req.socket.setTimeout(0);
  res.flushHeaders();
  res.write("retry: 2000\n\n");
  m.clients.add(res);
  m.offlineSince = null;
  m.lastSeen = Date.now();
  write(res, "snapshot", { code: r.code, you: { id: m.id, role: m.role, owner: m.id === r.ownerId, name: m.name }, state: stateView(r), members: membersView(r), ownerId: r.ownerId, queue: r.queue });
  pushMembers(r);
  const beat = setInterval(() => { try { res.write(": ping\n\n"); } catch (_) {} }, 15000);
  req.on("close", () => {
    clearInterval(beat);
    m.clients.delete(res);
    m.lastSeen = Date.now();
    if (!m.clients.size) m.offlineSince = Date.now();
    if (rooms.get(r.code) === r) pushMembers(r);
  });
});

/* ---------- commands ---------- */
function authed(req, res) {
  const b = req.body || {};
  const r = rooms.get(String(req.params.code));
  if (!r) { fail(res, 404, "not_found", "Room not found."); return null; }
  const m = findMember(r, b.mid, b.token);
  if (!m) { fail(res, 401, "not_member", "You are not in this room."); return null; }
  if (!allow("cmd", m.id, 40, 10000)) { fail(res, 429, "rate_limited", "Slow down a little."); return null; }
  m.lastSeen = Date.now();
  return { r: r, m: m, b: b };
}
function adminOnly(ctx, res) {
  if (ctx.m.role !== "admin") { fail(res, 403, "admins_only", "Only admins can do that."); return false; }
  return true;
}
function startTrack(r, track, by) {
  const s = r.state;
  s.track = track; s.playing = true; s.pos = 0; s.at = Date.now(); s.rev += 1; s.trackRev += 1; s.by = by;
}

router.post("/:code/cmd", (req, res) => {
  const ctx = authed(req, res);
  if (!ctx) return;
  if (!adminOnly(ctx, res)) return;
  const r = ctx.r, m = ctx.m, b = ctx.b, s = r.state;
  const type = String(b.type || "");
  const now = Date.now();
  let done = true;
  if (type === "play") {
    const t = parseTrack(b.track);
    if (!t) return fail(res, 400, "bad_track", "That song cannot be played in a room.");
    startTrack(r, t, m.id);
    pushState(r);
  } else if (type === "pause") {
    if (!s.track) return send(res, 200, { ok: true, rev: s.rev });
    s.pos = Math.max(0, positionNow(s)); s.playing = false; s.at = now; s.rev += 1; s.by = m.id;
    pushState(r);
  } else if (type === "resume") {
    if (!s.track) return send(res, 200, { ok: true, rev: s.rev });
    s.playing = true; s.at = now; s.rev += 1; s.by = m.id;
    pushState(r);
  } else if (type === "seek") {
    const p = Number(b.pos);
    if (!s.track || !Number.isFinite(p)) return fail(res, 400, "bad_seek", "Nothing to seek.");
    s.pos = Math.min(Math.max(0, p), 6 * 3600); s.at = now; s.rev += 1; s.by = m.id;
    pushState(r);
  } else if (type === "next") {
    if (b.trackRev != null && Number(b.trackRev) !== s.trackRev) return send(res, 200, { ok: true, stale: true, rev: s.rev });
    const nx = r.queue.shift();
    if (nx) { startTrack(r, nx, m.id); pushQueue(r); }
    else if (s.track) { s.playing = false; s.pos = 0; s.at = now; s.rev += 1; s.by = m.id; }
    pushState(r);
  } else if (type === "queue-add") {
    const t = parseTrack(b.track);
    if (!t) return fail(res, 400, "bad_track", "That song cannot be queued.");
    if (r.queue.length >= LIMITS.queue) return fail(res, 400, "limit", "The room queue is full.");
    if (b.front) r.queue.unshift(t); else r.queue.push(t);
    pushQueue(r);
  } else if (type === "queue-remove") {
    const i = Number(b.index);
    if (Number.isInteger(i) && i >= 0 && i < r.queue.length) r.queue.splice(i, 1);
    pushQueue(r);
  } else if (type === "queue-set") {
    r.queue = (Array.isArray(b.tracks) ? b.tracks.slice(0, LIMITS.queue) : []).map(parseTrack).filter(Boolean);
    pushQueue(r);
  } else if (type === "queue-clear") {
    r.queue = [];
    pushQueue(r);
  } else if (type === "queue-play") {
    const i = Number(b.index);
    if (!Number.isInteger(i) || i < 0 || i >= r.queue.length) return fail(res, 400, "bad_index", "That queue item is gone.");
    const t = r.queue.splice(i, 1)[0];
    startTrack(r, t, m.id);
    pushQueue(r); pushState(r);
  } else { done = false; }
  if (!done) return fail(res, 400, "bad_command", "Unknown command.");
  send(res, 200, { ok: true, rev: s.rev, trackRev: s.trackRev });
});

router.post("/:code/role", (req, res) => {
  const ctx = authed(req, res);
  if (!ctx || !adminOnly(ctx, res)) return;
  const target = ctx.r.members.get(String(ctx.b.target || ""));
  const role = ctx.b.role === "admin" ? "admin" : "listener";
  if (!target) return fail(res, 404, "not_found", "That person left.");
  if (target.id === ctx.r.ownerId) return fail(res, 400, "owner", "The room owner always stays admin.");
  target.role = role;
  pushMembers(ctx.r);
  target.clients.forEach((c) => write(c, "role", { role: role }));
  send(res, 200, { ok: true });
});

router.post("/:code/kick", (req, res) => {
  const ctx = authed(req, res);
  if (!ctx || !adminOnly(ctx, res)) return;
  const target = ctx.r.members.get(String(ctx.b.target || ""));
  if (!target) return fail(res, 404, "not_found", "That person left.");
  if (target.id === ctx.r.ownerId || target.id === ctx.m.id) return fail(res, 400, "bad_target", "You cannot remove that person.");
  if (target.ip) ctx.r.banned.add(target.ip);
  target.clients.forEach((c) => write(c, "kicked", {}));
  removeMember(ctx.r, target);
  send(res, 200, { ok: true });
});

router.post("/:code/leave", (req, res) => {
  const ctx = authed(req, res);
  if (!ctx) return;
  removeMember(ctx.r, ctx.m);
  send(res, 200, { ok: true });
});

router.post("/:code/close", (req, res) => {
  const ctx = authed(req, res);
  if (!ctx) return;
  if (ctx.m.id !== ctx.r.ownerId) return fail(res, 403, "owner_only", "Only the room owner can end the room.");
  dropRoom(ctx.r, "ended");
  send(res, 200, { ok: true });
});

/* ---------- housekeeping ---------- */
const sweeper = setInterval(() => {
  const now = Date.now();
  Array.from(rooms.values()).forEach((r) => {
    const online = Array.from(r.members.values()).filter((m) => m.clients.size > 0);
    if (!online.length) {
      r.emptySince = r.emptySince || now;
      if (now - r.emptySince > IDLE_ROOM_MS) rooms.delete(r.code);
      return;
    }
    r.emptySince = null;
    r.members.forEach((m) => {
      if (!m.clients.size && m.offlineSince && now - m.offlineSince > OFFLINE_DROP_MS && m.id !== r.ownerId) { r.members.delete(m.id); pushMembers(r); }
    });
    const adminOnline = online.some((m) => m.role === "admin");
    if (!adminOnline) {
      const away = Array.from(r.members.values()).filter((m) => m.role === "admin").map((m) => m.offlineSince || now);
      if (away.length && now - Math.min.apply(null, away) > ADMIN_GRACE_MS) {
        const next = online.sort((a, b) => a.joinedAt - b.joinedAt)[0];
        next.role = "admin"; r.ownerId = next.id;
        pushMembers(r);
        next.clients.forEach((c) => write(c, "role", { role: "admin" }));
      }
    }
  });
}, 5000);
if (sweeper.unref) sweeper.unref();

module.exports = router;
