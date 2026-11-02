"use strict";

/*
 * Zynoxify accounts + personal library (likes, playlists, playlist import).
 * - Credentials: email or phone + password. No SMS/email verification is performed.
 * - Passwords: scrypt with a per-user salt. Email/phone are stored only as an HMAC hash
 *   plus a masked hint, never in plain text.
 * - Sessions: random token in an HttpOnly SameSite=Lax cookie; only a hash of it is stored.
 * - Data lives in ./.zynoxify-data (self-ignored by Git, never served as a static file).
 * - YouTube metadata is refreshed weekly and dropped after 28 days without refresh
 *   (YouTube API Services policy: refresh or delete within 30 days).
 */

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const router = express.Router();

const DATA_DIR = process.env.ZYNOXIFY_DATA_DIR || path.join(__dirname, ".zynoxify-data");
const MUSIC_DIR = process.env.ZYNOXIFY_MUSIC_DIR || path.join(__dirname, "public", "assets", "zynoxify", "music");
const STORE_FILE = path.join(DATA_DIR, "store.json");
const SECRET_FILE = path.join(DATA_DIR, "secret.key");

const DAY = 24 * 3600 * 1000;
const SESSION_MS = 30 * DAY;
const REFRESH_MS = 7 * DAY;
const PURGE_MS = 28 * DAY;
const LIMITS = { likes: 2000, playlists: 50, tracksPerPlaylist: 500, importTracks: 200, sessionsPerUser: 10 };
const COOKIE = "zyx_sid";

/* ---------- storage ---------- */
fs.mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
try {
  const ignoreFile = path.join(DATA_DIR, ".gitignore");
  if (!fs.existsSync(ignoreFile)) fs.writeFileSync(ignoreFile, "*\n");
} catch (_) {}

let secret;
try {
  secret = fs.readFileSync(SECRET_FILE);
  if (secret.length < 32) throw new Error("short");
} catch (_) {
  secret = crypto.randomBytes(32);
  fs.writeFileSync(SECRET_FILE, secret, { mode: 0o600 });
}

const store = { users: {}, sessions: {} };
if (fs.existsSync(STORE_FILE)) {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, "utf8"));
    if (!raw || typeof raw !== "object") throw new Error("bad store");
    store.users = raw.users && typeof raw.users === "object" ? raw.users : {};
    store.sessions = raw.sessions && typeof raw.sessions === "object" ? raw.sessions : {};
  } catch (_) {
    try { fs.renameSync(STORE_FILE, path.join(DATA_DIR, "store.corrupt-" + Date.now() + ".json")); } catch (_e) {}
  }
}
const byHash = new Map();
Object.values(store.users).forEach((u) => { if (u && u.idHash) byHash.set(u.idHash, u.id); });
Object.keys(store.sessions).forEach((k) => {
  const s = store.sessions[k];
  if (!s || typeof s.exp !== "number" || s.exp < Date.now() || !store.users[s.uid]) delete store.sessions[k];
});

function saveNow() {
  const tmp = STORE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(store), { mode: 0o600 });
  fs.renameSync(tmp, STORE_FILE);
}

/* ---------- small helpers ---------- */
function send(res, status, body) {
  return res
    .status(status)
    .set("Cache-Control", "no-store")
    .set("X-Content-Type-Options", "nosniff")
    .type("application/json")
    .send(JSON.stringify(body));
}
function fail(res, status, code, message, extra) {
  return send(res, status, Object.assign({ error: { code: code, message: message } }, extra || {}));
}
function clip(value, max) {
  return String(value == null ? "" : value).replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}
function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function hmac(value) { return crypto.createHmac("sha256", secret).update(value).digest("hex"); }
function httpsUrl(value) {
  if (typeof value !== "string" || value.length > 400) return null;
  try { const u = new URL(value); return u.protocol === "https:" ? u.href : null; } catch (_) { return null; }
}
function coded(code) { const e = new Error(code); e.code = code; return e; }
const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error("[zynoxify-auth] " + ((err && err.code) || "internal_error"));
    if (!res.headersSent) fail(res, 500, "server_error", "Something went wrong. Please try again.");
  });

/* ---------- identifiers and passwords ---------- */
function normalizeIdentifier(raw) {
  const s = String(raw == null ? "" : raw).trim();
  if (!s || s.length > 120) return null;
  if (s.indexOf("@") >= 0) {
    const email = s.toLowerCase();
    if (!/^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/.test(email)) return null;
    const at = email.indexOf("@");
    return { kind: "email", value: email, hint: email[0] + "***" + email.slice(at) };
  }
  let digits = s.replace(/[\s\-().]/g, "");
  if (!/^(\+|00)?\d{10,15}$/.test(digits)) return null;
  digits = digits.replace(/^(\+|00)/, "");
  if (digits.length === 10) digits = "91" + digits; /* 10-digit numbers are treated as Indian (+91) */
  if (!/^\d{11,15}$/.test(digits)) return null;
  return { kind: "phone", value: digits, hint: "+" + digits.slice(0, digits.length - 10) + " ******" + digits.slice(-4) };
}
function idHashOf(id) { return hmac(id.kind + ":" + id.value); }

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
async function hashPassword(password, saltHex) {
  const salt = saltHex ? Buffer.from(saltHex, "hex") : crypto.randomBytes(16);
  const hash = await scrypt(password, salt, 64, SCRYPT);
  return { salt: salt.toString("hex"), hash: hash.toString("hex") };
}
async function checkPassword(user, password) {
  const pw = user && user.pw ? user.pw : { salt: "00".repeat(16), hash: "00".repeat(64) };
  const calc = await hashPassword(password, pw.salt);
  const a = Buffer.from(calc.hash, "hex");
  const b = Buffer.from(pw.hash, "hex");
  return !!user && a.length === b.length && crypto.timingSafeEqual(a, b);
}
function validPassword(p) { return typeof p === "string" && p.length >= 8 && p.length <= 128; }

/* ---------- sessions ---------- */
function parseCookies(header) {
  const out = {};
  String(header || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return out;
}
function setCookie(req, res, value, maxAgeSec) {
  const secure = req.secure || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";
  res.append("Set-Cookie", COOKIE + "=" + value + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + maxAgeSec + (secure ? "; Secure" : ""));
}
function startSession(req, res, user) {
  const token = crypto.randomBytes(32).toString("base64url");
  store.sessions[sha(token)] = { uid: user.id, exp: Date.now() + SESSION_MS, at: Date.now() };
  const mine = Object.keys(store.sessions).filter((k) => store.sessions[k].uid === user.id)
    .sort((a, b) => store.sessions[a].at - store.sessions[b].at);
  while (mine.length > LIMITS.sessionsPerUser) delete store.sessions[mine.shift()];
  saveNow();
  setCookie(req, res, token, Math.floor(SESSION_MS / 1000));
}
function sessionKey(req) {
  const t = parseCookies(req.headers.cookie)[COOKIE];
  return t ? sha(t) : null;
}
function currentUser(req) {
  const k = sessionKey(req);
  const s = k && store.sessions[k];
  if (!s || s.exp < Date.now()) return null;
  return store.users[s.uid] || null;
}
function publicUser(u) { return { id: u.id, name: u.name, kind: u.kind, hint: u.hint, createdAt: u.createdAt }; }
function requireUser(req, res) {
  const u = currentUser(req);
  if (!u) fail(res, 401, "not_signed_in", "Please sign in first.");
  return u;
}

/* ---------- abuse limits (in memory) ---------- */
const failures = new Map();
const WINDOW = 15 * 60 * 1000;
function lockedFor(key) {
  const f = failures.get(key);
  if (!f) return 0;
  if (Date.now() - f.first > WINDOW) { failures.delete(key); return 0; }
  return f.n >= 8 ? Math.max(1, Math.ceil((WINDOW - (Date.now() - f.first)) / 1000)) : 0;
}
function noteFail(key) {
  if (failures.size > 5000) failures.clear();
  const f = failures.get(key);
  if (!f || Date.now() - f.first > WINDOW) failures.set(key, { n: 1, first: Date.now() });
  else f.n += 1;
}
const hits = new Map();
function allow(bucket, key, max, windowMs) {
  const k = bucket + "|" + key;
  const now = Date.now();
  if (hits.size > 5000) hits.clear();
  const list = (hits.get(k) || []).filter((t) => now - t < windowMs);
  if (list.length >= max) { hits.set(k, list); return false; }
  list.push(now);
  hits.set(k, list);
  return true;
}

/* ---------- tracks ---------- */
function localExists(file) {
  if (typeof file !== "string" || !file || file.length > 220 || file !== path.basename(file)) return false;
  try { return fs.statSync(path.join(MUSIC_DIR, file)).isFile(); } catch (_) { return false; }
}
function stripTopic(name) { return String(name || "").replace(/\s*-\s*topic$/i, "").replace(/vevo$/i, "").trim(); }
function parseTrack(input) {
  if (!input || typeof input !== "object") return null;
  if (input.kind === "local") {
    return localExists(input.file) ? { kind: "local", file: input.file } : null;
  }
  if (input.kind === "youtube") {
    const id = typeof input.id === "string" ? input.id : "";
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    return {
      kind: "youtube", id: id,
      title: clip(input.title, 200), artist: clip(stripTopic(input.artist), 120),
      artworkUrl: httpsUrl(input.artworkUrl), refreshedAt: Date.now()
    };
  }
  return null;
}
function keyOf(t) { return t.kind === "local" ? "local:" + t.file : "yt:" + t.id; }
function viewOf(t) {
  if (t.kind === "local") return { key: keyOf(t), kind: "local", file: t.file };
  return {
    key: keyOf(t), kind: "youtube", provider: "youtube", id: t.id,
    title: t.title || "Saved video", artist: t.artist || "", artworkUrl: t.artworkUrl || null,
    playbackType: "youtube-embed",
    embedUrl: "https://www.youtube.com/embed/" + t.id,
    externalUrl: "https://www.youtube.com/watch?v=" + t.id,
    providerAttribution: "YouTube"
  };
}
function ensureLibrary(u) {
  if (!Array.isArray(u.likes)) u.likes = [];
  if (!Array.isArray(u.playlists)) u.playlists = [];
}
function allTracks(u) {
  const out = [];
  ensureLibrary(u);
  u.likes.forEach((t) => out.push(t));
  u.playlists.forEach((p) => (p.tracks || []).forEach((t) => out.push(t)));
  return out;
}

/* ---------- YouTube Data API (official) ---------- */
async function ytApi(endpoint, params) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw coded("no_key");
  const url = new URL("https://www.googleapis.com/youtube/v3/" + endpoint);
  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));
  url.searchParams.set("key", apiKey);
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(url.toString(), { headers: { Accept: "application/json" }, signal: ctl.signal });
    if (r.status === 404) throw coded("not_found");
    if (r.status === 403 || r.status === 429) {
      let reason = "";
      try { const b = await r.json(); reason = (b && b.error && b.error.errors && b.error.errors[0] && b.error.errors[0].reason) || ""; } catch (_) {}
      throw coded(/quota|rateLimit/i.test(reason) || r.status === 429 ? "quota" : "forbidden");
    }
    if (!r.ok) throw coded("upstream");
    return await r.json();
  } catch (e) {
    if (e && e.code) throw e;
    throw coded("upstream");
  } finally { clearTimeout(timer); }
}
function thumbOf(thumbs) {
  const t = thumbs || {};
  return httpsUrl((t.medium && t.medium.url) || (t.high && t.high.url) || (t.default && t.default.url) || "");
}

async function refreshTracks(user) {
  const now = Date.now();
  const tracks = allTracks(user).filter((t) => t.kind === "youtube");
  const stale = Array.from(new Set(tracks.filter((t) => now - (t.refreshedAt || 0) > REFRESH_MS).map((t) => t.id)));
  let changed = false;
  if (stale.length && process.env.YOUTUBE_API_KEY) {
    try {
      for (let i = 0; i < stale.length && i < 200; i += 50) {
        const chunk = stale.slice(i, i + 50);
        const data = await ytApi("videos", { part: "snippet,status", id: chunk.join(","), maxResults: "50" });
        const found = new Map();
        (data.items || []).forEach((v) => { if (v && v.id) found.set(v.id, v); });
        chunk.forEach((id) => {
          const v = found.get(id);
          tracks.filter((t) => t.id === id).forEach((t) => {
            if (v && v.snippet) {
              t.title = clip(v.snippet.title, 200);
              t.artist = clip(stripTopic(v.snippet.channelTitle), 120);
              t.artworkUrl = thumbOf(v.snippet.thumbnails);
              t.refreshedAt = now;
            } else { t.gone = true; }
          });
        });
      }
      changed = true;
    } catch (_) { /* keep what we have */ }
  }
  /* videos YouTube no longer returns are removed; metadata that could not be refreshed in 28 days is dropped */
  const dropGone = (list) => list.filter((t) => !(t.kind === "youtube" && t.gone));
  const before = user.likes.length + user.playlists.reduce((n, p) => n + p.tracks.length, 0);
  user.likes = dropGone(user.likes);
  user.playlists.forEach((p) => { p.tracks = dropGone(p.tracks); });
  const after = user.likes.length + user.playlists.reduce((n, p) => n + p.tracks.length, 0);
  if (after !== before) changed = true;
  allTracks(user).forEach((t) => {
    if (t.kind === "youtube" && now - (t.refreshedAt || 0) > PURGE_MS && (t.title || t.artist || t.artworkUrl)) {
      t.title = ""; t.artist = ""; t.artworkUrl = null; changed = true;
    }
  });
  if (changed) saveNow();
}

function parseYoutubePlaylist(raw) {
  let u;
  try { u = new URL(String(raw || "").trim()); } catch (_) { return { error: "invalid_url" }; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return { error: "invalid_url" };
  const host = u.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  if (host !== "youtube.com" && host !== "music.youtube.com") {
    if (host === "youtu.be" && u.searchParams.get("list")) { /* short link with a list parameter is fine */ }
    else if (/spotify|apple|jiosaavn|saavn|gaana|wynk|amazon|deezer|soundcloud|tidal|hungama|resso/i.test(host)) return { error: "unsupported_platform" };
    else return { error: "unsupported_link" };
  }
  const list = u.searchParams.get("list");
  if (!list || !/^[A-Za-z0-9_-]{10,64}$/.test(list)) return { error: "no_playlist_id" };
  if (/^(RD|LL|WL|UL|TL)/.test(list)) return { error: "mix_not_supported" };
  return { id: list };
}
async function importYoutubePlaylist(listId) {
  const meta = await ytApi("playlists", { part: "snippet", id: listId });
  if (!meta.items || !meta.items.length) throw coded("not_found");
  const title = clip(meta.items[0].snippet && meta.items[0].snippet.title, 60);
  const tracks = [];
  let skipped = 0, pageToken = "";
  for (let page = 0; page < 4 && tracks.length < LIMITS.importTracks; page++) {
    const params = { part: "snippet", maxResults: "50", playlistId: listId };
    if (pageToken) params.pageToken = pageToken;
    const d = await ytApi("playlistItems", params);
    (d.items || []).forEach((it) => {
      const sn = it && it.snippet;
      const vid = sn && sn.resourceId && sn.resourceId.videoId;
      if (!vid || !/^[A-Za-z0-9_-]{11}$/.test(vid) || /^(private|deleted) video$/i.test(sn.title || "")) { skipped += 1; return; }
      if (tracks.length >= LIMITS.importTracks) { skipped += 1; return; }
      tracks.push({
        kind: "youtube", id: vid, title: clip(sn.title, 200),
        artist: clip(stripTopic(sn.videoOwnerChannelTitle || sn.channelTitle), 120),
        artworkUrl: thumbOf(sn.thumbnails), refreshedAt: Date.now()
      });
    });
    pageToken = d.nextPageToken || "";
    if (!pageToken) break;
  }
  return { title: title, tracks: tracks, skipped: skipped };
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

/* ---------- account routes ---------- */
router.get("/me", (req, res) => {
  const u = currentUser(req);
  send(res, 200, { user: u ? publicUser(u) : null });
});

router.post("/register", wrap(async (req, res) => {
  if (!allow("register", req.ip, 10, 3600 * 1000)) return fail(res, 429, "rate_limited", "Too many sign-ups from this device. Try again later.");
  const b = req.body || {};
  const id = normalizeIdentifier(b.identifier);
  if (!id) return fail(res, 400, "bad_identifier", "Enter a valid email address or mobile number.");
  if (!validPassword(b.password)) return fail(res, 400, "bad_password", "Password must be 8 to 128 characters.");
  const h = idHashOf(id);
  if (byHash.has(h)) return fail(res, 409, "exists", "An account with this email or number already exists.");
  const name = clip(b.name, 40) || (id.kind === "email" ? clip(id.value.split("@")[0], 24) : "") || "Listener";
  const pw = await hashPassword(b.password);
  if (byHash.has(h)) return fail(res, 409, "exists", "An account with this email or number already exists.");
  const user = {
    id: crypto.randomBytes(9).toString("hex"), name: name, kind: id.kind, hint: id.hint,
    idHash: h, pw: pw, createdAt: Date.now(), likes: [], playlists: []
  };
  store.users[user.id] = user;
  byHash.set(h, user.id);
  startSession(req, res, user);
  send(res, 201, { user: publicUser(user) });
}));

router.post("/login", wrap(async (req, res) => {
  const b = req.body || {};
  const id = normalizeIdentifier(b.identifier);
  const generic = () => fail(res, 401, "bad_credentials", "Wrong email/number or password.");
  if (!id || typeof b.password !== "string" || b.password.length > 128) { await checkPassword(null, "x"); return generic(); }
  const h = idHashOf(id);
  const key = req.ip + "|" + h;
  const wait = lockedFor(key);
  if (wait) { res.set("Retry-After", String(wait)); return fail(res, 429, "locked", "Too many attempts. Try again in a few minutes."); }
  const user = byHash.has(h) ? store.users[byHash.get(h)] : null;
  const ok = await checkPassword(user, b.password);
  if (!ok) { noteFail(key); return generic(); }
  failures.delete(key);
  startSession(req, res, user);
  send(res, 200, { user: publicUser(user) });
}));

router.post("/logout", (req, res) => {
  const k = sessionKey(req);
  if (k && store.sessions[k]) { delete store.sessions[k]; saveNow(); }
  setCookie(req, res, "", 0);
  send(res, 200, { ok: true });
});

router.post("/delete-account", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const b = req.body || {};
  if (typeof b.password !== "string" || !(await checkPassword(user, b.password))) return fail(res, 401, "bad_credentials", "Wrong password.");
  Object.keys(store.sessions).forEach((k) => { if (store.sessions[k].uid === user.id) delete store.sessions[k]; });
  byHash.delete(user.idHash);
  delete store.users[user.id];
  saveNow();
  setCookie(req, res, "", 0);
  send(res, 200, { ok: true });
}));

/* ---------- library routes ---------- */
router.get("/library", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  ensureLibrary(user);
  await refreshTracks(user);
  send(res, 200, {
    likes: user.likes.map(viewOf),
    playlists: user.playlists.map((p) => ({ id: p.id, name: p.name, createdAt: p.createdAt, tracks: p.tracks.map(viewOf) })),
    notice: "Saved on this server for your account. YouTube details refresh weekly."
  });
}));

router.post("/likes/toggle", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  ensureLibrary(user);
  const t = parseTrack((req.body || {}).track);
  if (!t) return fail(res, 400, "bad_track", "That track cannot be saved.");
  const k = keyOf(t);
  const i = user.likes.findIndex((x) => keyOf(x) === k);
  let liked;
  if (i >= 0) { user.likes.splice(i, 1); liked = false; }
  else {
    if (user.likes.length >= LIMITS.likes) return fail(res, 400, "limit", "You have reached the likes limit.");
    user.likes.unshift(t); liked = true;
  }
  saveNow();
  send(res, 200, { liked: liked, keys: user.likes.map(keyOf) });
}));

function findPlaylist(user, id) { ensureLibrary(user); return user.playlists.find((p) => p.id === id) || null; }
function summary(p) { return { id: p.id, name: p.name, count: p.tracks.length }; }

router.post("/playlists", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  ensureLibrary(user);
  const name = clip((req.body || {}).name, 60);
  if (!name) return fail(res, 400, "bad_name", "Give the playlist a name.");
  if (user.playlists.length >= LIMITS.playlists) return fail(res, 400, "limit", "You have reached the playlist limit.");
  const p = { id: crypto.randomBytes(6).toString("hex"), name: name, createdAt: Date.now(), tracks: [] };
  user.playlists.push(p);
  saveNow();
  send(res, 201, { playlist: summary(p) });
}));

router.patch("/playlists/:id", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const p = findPlaylist(user, req.params.id);
  if (!p) return fail(res, 404, "not_found", "Playlist not found.");
  const name = clip((req.body || {}).name, 60);
  if (!name) return fail(res, 400, "bad_name", "Give the playlist a name.");
  p.name = name;
  saveNow();
  send(res, 200, { playlist: summary(p) });
}));

router.delete("/playlists/:id", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const p = findPlaylist(user, req.params.id);
  if (!p) return fail(res, 404, "not_found", "Playlist not found.");
  user.playlists = user.playlists.filter((x) => x !== p);
  saveNow();
  send(res, 200, { ok: true });
}));

router.post("/playlists/:id/tracks", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const p = findPlaylist(user, req.params.id);
  if (!p) return fail(res, 404, "not_found", "Playlist not found.");
  const t = parseTrack((req.body || {}).track);
  if (!t) return fail(res, 400, "bad_track", "That track cannot be added.");
  if (p.tracks.some((x) => keyOf(x) === keyOf(t))) return send(res, 200, { added: false, playlist: summary(p) });
  if (p.tracks.length >= LIMITS.tracksPerPlaylist) return fail(res, 400, "limit", "This playlist is full.");
  p.tracks.push(t);
  saveNow();
  send(res, 200, { added: true, playlist: summary(p) });
}));

router.post("/playlists/:id/tracks/remove", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  const p = findPlaylist(user, req.params.id);
  if (!p) return fail(res, 404, "not_found", "Playlist not found.");
  const k = String((req.body || {}).key || "");
  const before = p.tracks.length;
  p.tracks = p.tracks.filter((x) => keyOf(x) !== k);
  if (p.tracks.length !== before) saveNow();
  send(res, 200, { removed: before - p.tracks.length, playlist: summary(p) });
}));

router.post("/import", wrap(async (req, res) => {
  const user = requireUser(req, res);
  if (!user) return;
  ensureLibrary(user);
  if (!allow("import", user.id, 10, 3600 * 1000)) return fail(res, 429, "rate_limited", "Too many imports. Try again in an hour.");
  const parsed = parseYoutubePlaylist((req.body || {}).url);
  const messages = {
    invalid_url: "That does not look like a link.",
    unsupported_platform: "That music service does not allow playlist import without its own developer access. YouTube and YouTube Music playlist links work.",
    unsupported_link: "Only YouTube and YouTube Music playlist links can be imported.",
    no_playlist_id: "That link does not contain a playlist. Open the playlist itself and copy its link.",
    mix_not_supported: "Auto-generated mixes cannot be imported. Use a normal playlist link."
  };
  if (parsed.error) return fail(res, 400, parsed.error, messages[parsed.error]);
  if (user.playlists.length >= LIMITS.playlists) return fail(res, 400, "limit", "You have reached the playlist limit.");
  let result;
  try { result = await importYoutubePlaylist(parsed.id); }
  catch (e) {
    const map = {
      no_key: [503, "Online import is not available because YouTube is not configured on this server."],
      not_found: [404, "Playlist not found. It may be private or deleted."],
      quota: [429, "YouTube's daily limit was reached. Try again tomorrow."],
      forbidden: [403, "YouTube would not share that playlist."],
      upstream: [502, "YouTube did not respond. Try again."]
    };
    const m = map[e && e.code] || map.upstream;
    return fail(res, m[0], (e && e.code) || "upstream", m[1]);
  }
  if (!result.tracks.length) return fail(res, 400, "empty", "That playlist has no playable videos.");
  const name = clip((req.body || {}).name, 60) || result.title || "Imported playlist";
  const p = { id: crypto.randomBytes(6).toString("hex"), name: name, createdAt: Date.now(), tracks: result.tracks };
  user.playlists.push(p);
  saveNow();
  send(res, 201, { playlist: summary(p), skipped: result.skipped });
}));

module.exports = router;
