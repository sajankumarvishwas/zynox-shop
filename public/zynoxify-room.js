/* ZYNOXIFY MUSIC - Play together (client): rooms with a 4-digit code, admins control, everyone follows */
(function () {
  "use strict";
  const root = document.getElementById("zyx-root");
  const app = window.ZynoxifyMusic;
  if (!root || !app || typeof app.roomPlay !== "function") return;

  const $ = (id) => document.getElementById(id);
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  function icon(symbol) {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("class", "zyx-ic");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(NS, "use");
    use.setAttribute("href", "#" + symbol);
    svg.appendChild(use);
    return svg;
  }
  function say(text) {
    const live = $("zyx-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = text; }, 40);
  }
  const songs = app.getSongs();
  const SKEY = "zynoxify:room";
  const NKEY = "zynoxify:nudge";
  const EMBED = /\/embed\/([A-Za-z0-9_-]{11})$/;

  /* ---------- state ---------- */
  let me = null, room = null, es = null, offset = 0, loop = 0, clockTimer = 0;
  let lastFix = 0, loadingKey = "", loadStarted = 0, forceSync = false, status = "idle", errCount = 0;
  let nudge = 0;
  try { nudge = Math.max(-300, Math.min(300, Number(localStorage.getItem(NKEY)) || 0)); } catch (_) {}
  const ROOM = { active: false, intercept: intercept, plan: planStep };
  window.ZynoxifyRoom = ROOM;

  async function api(path, body, method) {
    const opts = { method: method || (body === undefined ? "GET" : "POST"), cache: "no-store", headers: { Accept: "application/json" } };
    if (opts.method !== "GET") { opts.headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(body || {}); }
    let res;
    try { res = await fetch("/api/room" + path, opts); }
    catch (_) { return { ok: false, status: 0, data: { error: { message: "Could not reach the server. Are you on the same Wi-Fi?" } } }; }
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data: data || {} };
  }
  const errText = (r) => (r && r.data && r.data.error && r.data.error.message) || "Something went wrong.";
  const serverNow = () => Date.now() + offset;
  async function syncClock() {
    let best = null;
    for (let i = 0; i < 5; i++) {
      const wall0 = Date.now(), t0 = performance.now();
      const r = await api("/time");
      const rtt = performance.now() - t0;
      if (r.ok && (!best || rtt < best.rtt)) best = { rtt: rtt, off: r.data.t - (wall0 + rtt / 2) };
      await new Promise((ok) => setTimeout(ok, 80));
    }
    if (best) offset = best.off;
  }

  /* ---------- tracks <-> entries ---------- */
  function trackOfEntry(e) {
    if (!e) return null;
    if (e.kind === "local") { const s = songs[e.idx]; return s ? { kind: "local", file: s.file } : null; }
    const it = e.item || {};
    const m = typeof it.embedUrl === "string" && it.embedUrl.match(EMBED);
    return m ? { kind: "youtube", id: m[1], title: it.title || "", artist: it.artist || "", artworkUrl: it.artworkUrl || null } : null;
  }
  function entryOfTrack(t) {
    if (!t) return null;
    if (t.kind === "local") { const idx = songs.findIndex((s) => s.file === t.file); return idx < 0 ? null : { kind: "local", idx: idx }; }
    return { kind: "online", item: {
      provider: "youtube", providerAttribution: "YouTube", playbackType: "youtube-embed", id: t.id, providerTrackId: t.id,
      title: t.title || "YouTube video", artist: t.artist || "", artworkUrl: t.artworkUrl || null,
      embedUrl: "https://www.youtube.com/embed/" + t.id, externalUrl: "https://www.youtube.com/watch?v=" + t.id } };
  }
  const keyOf = (t) => t ? (t.kind === "local" ? "local:" + t.file : "yt:" + t.id) : "";
  function titleOf(t) {
    if (!t) return { title: "Nothing playing yet", artist: "" };
    if (t.kind === "local") { const s = songs.find((x) => x.file === t.file); return { title: s ? s.title : "Local song", artist: s ? s.artist : "" }; }
    return { title: t.title || "YouTube video", artist: t.artist || "" };
  }

  /* ---------- the sync decision (pure, easy to test) ---------- */
  function planStep(st, info, nowServer, o) {
    if (!st.track) return { action: info.playing ? "pause" : "none", status: "idle" };
    if (info.key !== keyOf(st.track)) return { action: "load", status: "loading" };
    if (!info.ready || info.buffering) return { action: "wait", status: "buffering" };
    const thr = info.kind === "embed" ? 0.9 : 0.35;
    if (st.playing && info.ended) return { action: "wait", status: "syncing" };
    if (st.playing) {
      const exp = st.pos + (nowServer - st.at) / 1000 + o.nudge / 1000;
      const drift = info.time - exp;
      if (!info.playing) return { action: "resume", pos: Math.max(0, exp), seek: Math.abs(drift) > thr, status: "syncing" };
      if ((Math.abs(drift) > thr && o.sinceFix > 2500) || o.force) return { action: "seek", pos: Math.max(0, exp), status: "syncing" };
      return { action: "none", status: "synced", drift: drift };
    }
    if (info.playing) return { action: "pause", status: "paused" };
    if ((Math.abs(info.time - st.pos) > 0.6 && o.sinceFix > 1500) || o.force) return { action: "seek", pos: st.pos, status: "paused" };
    return { action: "none", status: "paused" };
  }
  function tick() {
    if (!ROOM.active || !room) return;
    const st = room.state, info = app.roomInfo(), now = performance.now();
    const p = planStep(st, info, serverNow(), { nudge: nudge, sinceFix: now - lastFix, force: forceSync });
    if (p.action === "load") {
      const k = keyOf(st.track);
      if (loadingKey !== k || now - loadStarted > 7000) {
        loadingKey = k; loadStarted = now;
        const entry = entryOfTrack(st.track);
        if (!entry) p.status = "missing"; else app.roomPlay(entry);
      } else if (!entryOfTrack(st.track)) p.status = "missing";
    } else {
      loadingKey = "";
      if (p.action === "pause") app.roomPause();
      else if (p.action === "resume") { app.roomResume(); if (p.seek) { app.roomSeek(p.pos); lastFix = now; } }
      else if (p.action === "seek") { app.roomSeek(p.pos); lastFix = now; forceSync = false; }
    }
    if (p.action !== "seek") forceSync = forceSync && p.action === "wait";
    setStatus(p.status);
  }

  /* ---------- admin gate (called from zynoxify.js) ---------- */
  async function send(type, extra, okText) {
    if (!me) return null;
    const r = await api("/" + me.code + "/cmd", Object.assign({ mid: me.id, token: me.token, type: type }, extra || {}));
    if (!r.ok) say(errText(r)); else if (okText) say(okText);
    return r;
  }
  function intercept(kind, p) {
    if (!ROOM.active || !me) return false;
    if (me.role !== "admin") {
      if (kind === "next" && p && p.auto) return true;
      say("Only room admins can control playback.");
      return true;
    }
    if (kind === "play") {
      const t = trackOfEntry(p);
      if (!t) say("This song cannot be played in a room."); else send("play", { track: t });
    } else if (kind === "toggle") {
      send(room && room.state.playing ? "pause" : "resume");
    } else if (kind === "next") {
      send("next", { trackRev: room ? room.state.trackRev : undefined });
    } else if (kind === "prev") {
      send("seek", { pos: 0 });
    } else if (kind === "queue") {
      const t = trackOfEntry(p.entry);
      if (!t) say("This song cannot be queued in a room."); else send("queue-add", { track: t, front: !!p.front }, p.front ? "Playing next for the room" : "Added to the room queue");
    } else if (kind === "playlist") {
      const tracks = (p.entries || []).map(trackOfEntry).filter(Boolean);
      if (tracks.length) send("play", { track: tracks[0] }).then(() => send("queue-set", { tracks: tracks.slice(1) }));
    }
    return true;
  }

  /* ---------- connection ---------- */
  function saveSession() { try { sessionStorage.setItem(SKEY, JSON.stringify({ code: me.code, id: me.id, token: me.token, name: me.name })); } catch (_) {} }
  function clearSession() { try { sessionStorage.removeItem(SKEY); } catch (_) {} }
  function setStatus(s) {
    if (s === status) return;
    status = s;
    renderBar();
    const t = $("zyx-room-status-text");
    if (t) renderStatus();
  }
  const SHORT = { synced: "Synced", syncing: "Syncing", buffering: "Buffering", paused: "Paused", loading: "Loading", idle: "Waiting", missing: "Missing song", reconnecting: "Offline" };
  const STATUS = { synced: "Synced", syncing: "Syncing...", buffering: "Buffering...", paused: "Paused", loading: "Loading song...", idle: "Waiting for the admin", missing: "This song is not on your phone", reconnecting: "Reconnecting..." };

  function connect() {
    if (es) { es.close(); es = null; }
    es = new EventSource("/api/room/" + me.code + "/events?mid=" + encodeURIComponent(me.id) + "&tok=" + encodeURIComponent(me.token));
    es.addEventListener("snapshot", (e) => {
      const d = JSON.parse(e.data);
      errCount = 0;
      room = { code: d.code, state: d.state, members: d.members, ownerId: d.ownerId, queue: d.queue || [] };
      me.role = d.you.role; me.owner = d.you.owner; me.name = d.you.name;
      setStatus("loading");
      renderAll();
      tick();
    });
    es.addEventListener("state", (e) => { if (room) { room.state = JSON.parse(e.data); forceSync = false; renderNow(); tick(); } });
    es.addEventListener("members", (e) => { if (room) { const d = JSON.parse(e.data); room.members = d.members; room.ownerId = d.ownerId; const mine = d.members.find((m) => m.id === me.id); if (mine) { me.role = mine.role; me.owner = mine.owner; } renderAll(); } });
    es.addEventListener("queue", (e) => { if (room) { room.queue = JSON.parse(e.data).queue; renderQueue(); } });
    es.addEventListener("role", (e) => { const d = JSON.parse(e.data); me.role = d.role; renderAll(); say(d.role === "admin" ? "You are now a room admin." : "You are now a listener."); });
    es.addEventListener("kicked", () => leaveLocal("You were removed from the room."));
    es.addEventListener("closed", () => leaveLocal("The room was ended."));
    es.onerror = async () => {
      setStatus("reconnecting");
      errCount += 1;
      if (es && es.readyState === 2) {
        const r = await api("/join", { code: me.code, mid: me.id, token: me.token });
        if (r.ok) connect(); else leaveLocal(r.status === 404 ? "The room is gone." : errText(r));
      }
    };
  }
  function startSession(m) {
    me = m;
    ROOM.active = true;
    root.classList.add("is-in-room");
    saveSession();
    errCount = 0;
    syncClock().then(() => tick());
    clearInterval(clockTimer); clockTimer = setInterval(syncClock, 60000);
    clearInterval(loop); loop = setInterval(tick, 500);
    connect();
    ensureBar();
    renderAll();
  }
  function leaveLocal(msg) {
    const wasPlaying = app.roomInfo().playing;
    ROOM.active = false;
    clearInterval(loop); clearInterval(clockTimer);
    if (es) { es.close(); es = null; }
    me = null; room = null; clearSession();
    root.classList.remove("is-in-room", "is-room-listener");
    closeRoomPanel(true);
    renderBar();
    document.querySelectorAll(".zyx-player-label").forEach((l) => { l.textContent = "NOW PLAYING"; });
    if (wasPlaying) app.roomPause();
    if (msg) say(msg);
  }
  async function leave() {
    if (me) await api("/" + me.code + "/leave", { mid: me.id, token: me.token });
    leaveLocal("You left the room.");
  }
  async function endRoom() {
    if (me) await api("/" + me.code + "/close", { mid: me.id, token: me.token });
    leaveLocal("The room was ended.");
  }

  /* ---------- UI: floating bar ---------- */
  let barEl = null;
  function ensureBar() {
    if (barEl) return;
    barEl = make("button", "zyx-roombar");
    barEl.type = "button";
    barEl.hidden = true;
    barEl.addEventListener("click", openRoomPanel);
    root.appendChild(barEl);
  }
  function renderBar() {
    if (!barEl) return;
    if (!ROOM.active || !room) { barEl.hidden = true; return; }
    barEl.hidden = false;
    barEl.replaceChildren();
    barEl.dataset.status = status;
    barEl.appendChild(icon("zi-users"));
    const online = room.members.filter((m) => m.online).length;
    barEl.appendChild(make("span", "zyx-roombar-text", "Room " + room.code + " \u00b7 " + online + " here"));
    barEl.appendChild(make("span", "zyx-roombar-status", SHORT[status] || ""));
    barEl.setAttribute("aria-label", "Open room " + room.code + ". " + (STATUS[status] || ""));
    document.querySelectorAll(".zyx-player-label").forEach((l) => { l.textContent = "ROOM " + room.code; });
  }

  /* ---------- UI: chooser (create / join) ---------- */
  const CHOOSER_HTML = `
    <div class="zyx-auth-orbs" aria-hidden="true"><i></i><i></i></div>
    <button class="zyx-auth-close" type="button" id="zyx-pt-close" aria-label="Close"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-close"/></svg></button>
    <div class="zyx-auth-scroll">
      <svg class="zyx-pt-hero" viewBox="0 0 140 110" aria-hidden="true" focusable="false">
        <defs><linearGradient id="zp-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7f98"/><stop offset=".55" stop-color="#ff2e55"/><stop offset="1" stop-color="#a4113a"/></linearGradient>
        <linearGradient id="zp-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3347"/><stop offset="1" stop-color="#171a26"/></linearGradient></defs>
        <g class="zp-waves" fill="none" stroke="url(#zp-g)" stroke-width="3" stroke-linecap="round"><path d="M58 40q-12 15 0 30"/><path d="M50 32q-20 23 0 46"/><path d="M82 40q12 15 0 30"/><path d="M90 32q20 23 0 46"/></g>
        <rect x="18" y="26" width="34" height="58" rx="8" fill="url(#zp-p)" stroke="#3b4258" stroke-width="2" transform="rotate(-8 35 55)"/>
        <rect x="88" y="26" width="34" height="58" rx="8" fill="url(#zp-p)" stroke="#3b4258" stroke-width="2" transform="rotate(8 105 55)"/>
        <circle cx="35" cy="55" r="6" fill="url(#zp-g)"/><circle cx="105" cy="55" r="6" fill="url(#zp-g)"/>
      </svg>
      <h2 class="zyx-auth-title">Play together</h2>
      <p class="zyx-auth-sub">Everyone in the room hears the same song at the same time. Admins pick the music, everyone else just listens.</p>
      <div class="zyx-pt-choices" id="zyx-pt-choices">
        <button type="button" class="zyx-pt-choice" id="zyx-pt-mk"><span class="zyx-pt-choice-art"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-plus"/></svg></span><span><strong>Create a room</strong><small>You become the admin</small></span></button>
        <button type="button" class="zyx-pt-choice" id="zyx-pt-jn"><span class="zyx-pt-choice-art"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-users"/></svg></span><span><strong>Join a room</strong><small>Enter the 4-digit code</small></span></button>
      </div>
      <form class="zyx-auth-form zyx-pt-form" id="zyx-pt-form" hidden novalidate>
        <label class="zyx-auth-field" id="zyx-pt-code-wrap"><span>Room code</span><input id="zyx-pt-code" class="zyx-pt-code" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" placeholder="0000"></label>
        <label class="zyx-auth-field"><span>Your name</span><input id="zyx-pt-name" type="text" maxlength="24" autocomplete="nickname" placeholder="What should friends see?"></label>
        <p class="zyx-auth-error" id="zyx-pt-error" role="alert" hidden></p>
        <button class="zyx-auth-submit" id="zyx-pt-go" type="submit"><span class="zyx-auth-submit-text" id="zyx-pt-go-text">Create room</span><span class="zyx-auth-spin" aria-hidden="true"></span></button>
        <button class="zyx-auth-forgot" id="zyx-pt-back" type="button">Back</button>
      </form>
      <p class="zyx-auth-note">Works best when everyone is on the same Wi-Fi or hotspot as the phone running Zynoxify.</p>
    </div>`;
  let chEl = null, chMode = "create", chBusy = false;
  const P = (id) => $("zyx-pt-" + id);
  function chError(t) { const e = P("error"); e.textContent = t || ""; e.hidden = !t; }
  function chShow(mode) {
    chMode = mode;
    P("choices").hidden = !!mode;
    P("form").hidden = !mode;
    if (!mode) return;
    P("code-wrap").hidden = mode !== "join";
    P("go-text").textContent = mode === "join" ? "Join room" : "Create room";
    chError("");
    if (!P("name").value) {
      let saved = ""; try { saved = localStorage.getItem("zynoxify:roomname") || ""; } catch (_) {}
      const u = window.ZynoxifyAccount && window.ZynoxifyAccount.getUser && window.ZynoxifyAccount.getUser();
      P("name").value = saved || (u && u.name) || "";
    }
    setTimeout(() => { (mode === "join" ? P("code") : P("name")).focus({ preventScroll: true }); }, 250);
  }
  function openChooser(mode, code) {
    if (ROOM.active) { openRoomPanel(); return; }
    if (!chEl) {
      chEl = make("div", "zyx-auth zyx-pt");
      chEl.setAttribute("role", "dialog"); chEl.setAttribute("aria-modal", "true"); chEl.setAttribute("aria-label", "Play together");
      chEl.hidden = true;
      chEl.innerHTML = CHOOSER_HTML; /* static markup written by us */
      root.appendChild(chEl);
      P("close").addEventListener("click", closeChooser);
      P("mk").addEventListener("click", () => chShow("create"));
      P("jn").addEventListener("click", () => chShow("join"));
      P("back").addEventListener("click", () => chShow(""));
      P("code").addEventListener("input", () => { P("code").value = P("code").value.replace(/\D/g, "").slice(0, 4); });
      P("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (chBusy) return;
        const name = P("name").value.trim();
        const code = P("code").value.trim();
        if (chMode === "join" && !/^\d{4}$/.test(code)) { chError("Enter the 4-digit room code."); return; }
        chBusy = true; P("go").disabled = true; P("go").classList.add("is-busy"); chError("");
        try { localStorage.setItem("zynoxify:roomname", name); } catch (_) {}
        const r = chMode === "join" ? await api("/join", { code: code, name: name }) : await api("/create", { name: name });
        chBusy = false; P("go").disabled = false; P("go").classList.remove("is-busy");
        if (!r.ok) { chError(errText(r)); return; }
        closeChooser();
        startSession(r.data.me);
        say(chMode === "join" ? "Joined room " + r.data.me.code : "Room " + r.data.me.code + " is ready. Share the code.");
        setTimeout(openRoomPanel, 450);
      });
    }
    chEl.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => chEl.classList.add("is-open")));
    chShow(mode || "");
    if (code) P("code").value = String(code).replace(/\D/g, "").slice(0, 4);
  }
  function closeChooser() {
    if (!chEl || chEl.hidden) return;
    chEl.classList.remove("is-open");
    setTimeout(() => { if (!chEl.classList.contains("is-open")) chEl.hidden = true; }, 420);
  }

  /* ---------- UI: room panel ---------- */
  const ROOM_HTML = `
    <div class="zyx-auth-orbs" aria-hidden="true"><i></i><i></i></div>
    <div class="zyx-room-scroll">
      <div class="zyx-room-top">
        <button type="button" class="zyx-ml-iconbtn" id="zyx-room-min" aria-label="Minimize room"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-down"/></svg></button>
        <div class="zyx-room-codebox"><small>ROOM CODE</small><strong id="zyx-room-code">0000</strong></div>
        <button type="button" class="zyx-ml-iconbtn" id="zyx-room-copy" aria-label="Copy room code"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-copy"/></svg></button>
      </div>
      <p class="zyx-room-status" id="zyx-room-status"><span class="zyx-led" aria-hidden="true"></span><span id="zyx-room-status-text">Connecting</span></p>
      <div class="zyx-room-now" id="zyx-room-now"></div>
      <div class="zyx-room-card">
        <strong>Invite friends</strong>
        <p id="zyx-room-url" class="zyx-room-url"></p>
        <button type="button" class="zyx-ml-btn" id="zyx-room-copyurl"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-copy"/></svg><span>Copy invite link</span></button>
      </div>
      <div class="zyx-room-card">
        <label class="zyx-room-nudgehead" for="zyx-room-nudge"><strong>Fine-tune this phone</strong><span id="zyx-room-nudge-val">0 ms</span></label>
        <input class="zyx-range zyx-room-nudge" id="zyx-room-nudge" type="range" min="-300" max="300" step="10" value="0">
        <small>Sounds late? Slide right. Sounds early? Slide left.</small>
        <button type="button" class="zyx-ml-btn" id="zyx-room-resync"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-sync"/></svg><span>Resync now</span></button>
      </div>
      <h3 class="zyx-room-h">In this room <span id="zyx-room-count"></span></h3>
      <ul class="zyx-room-members" id="zyx-room-members"></ul>
      <h3 class="zyx-room-h">Room queue</h3>
      <div id="zyx-room-queue"></div>
      <div class="zyx-room-actions">
        <button type="button" class="zyx-auth-submit zyx-auth-submit--soft" id="zyx-room-leave"><span class="zyx-auth-submit-text">Leave room</span></button>
        <button type="button" class="zyx-auth-forgot zyx-acctmenu-del" id="zyx-room-end" hidden>End room for everyone</button>
      </div>
    </div>`;
  let panelEl = null;
  const Rm = (id) => $("zyx-room-" + id);
  function buildPanel() {
    panelEl = make("div", "zyx-auth zyx-room");
    panelEl.setAttribute("role", "dialog"); panelEl.setAttribute("aria-modal", "true"); panelEl.setAttribute("aria-label", "Room");
    panelEl.hidden = true;
    panelEl.innerHTML = ROOM_HTML; /* static markup written by us */
    root.appendChild(panelEl);
    Rm("min").addEventListener("click", () => closeRoomPanel());
    Rm("copy").addEventListener("click", async () => { say((await copyText(room ? room.code : "")) ? "Room code copied" : "Could not copy. Read the code out loud instead."); });
    Rm("copyurl").addEventListener("click", async () => { say((await copyText(inviteUrl())) ? "Invite link copied" : "Could not copy the link."); });
    Rm("nudge").value = String(nudge);
    Rm("nudge-val").textContent = nudgeLabel();
    Rm("nudge").addEventListener("input", () => {
      nudge = Number(Rm("nudge").value) || 0;
      Rm("nudge-val").textContent = nudgeLabel();
      try { localStorage.setItem(NKEY, String(nudge)); } catch (_) {}
      forceSync = true;
    });
    Rm("resync").addEventListener("click", () => { forceSync = true; lastFix = 0; tick(); say("Resyncing with the room"); });
    Rm("leave").addEventListener("click", leave);
    Rm("end").addEventListener("click", endRoom);
    Rm("members").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-act]");
      if (!b || !me) return;
      const body = { mid: me.id, token: me.token, target: b.dataset.id };
      if (b.dataset.act === "kick") api("/" + me.code + "/kick", body).then((r) => { if (!r.ok) say(errText(r)); });
      else api("/" + me.code + "/role", Object.assign(body, { role: b.dataset.act === "promote" ? "admin" : "listener" })).then((r) => { if (!r.ok) say(errText(r)); });
    });
    Rm("queue").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-qact]");
      if (!b) return;
      if (b.dataset.qact === "clear") send("queue-clear");
      else if (b.dataset.qact === "remove") send("queue-remove", { index: Number(b.dataset.i) });
      else if (b.dataset.qact === "play") send("queue-play", { index: Number(b.dataset.i) });
    });
  }
  const nudgeLabel = () => (nudge > 0 ? "+" : "") + nudge + " ms";
  function inviteUrl() {
    const base = lanBase || location.origin;
    return base + "/zynoxify.html?room=" + (room ? room.code : "");
  }
  let lanBase = "";
  async function loadLan() {
    const r = await api("/lan");
    if (r.ok && r.data.urls && r.data.urls.length) lanBase = r.data.urls[0];
    renderShare();
  }
  function renderShare() {
    const el = Rm("url");
    if (!el) return;
    const host = location.hostname;
    const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
    if (lanBase || !local) { el.textContent = inviteUrl(); el.classList.remove("is-warn"); }
    else {
      el.textContent = "Friends must open this app with your phone's Wi-Fi address, for example http://192.168.1.5:" + (location.port || "3001") + "/zynoxify.html and enter the code " + (room ? room.code : "") + ". Find the address in your Wi-Fi settings.";
      el.classList.add("is-warn");
    }
  }
  async function copyText(t) {
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(t); return true; } } catch (_) {}
    try {
      const ta = make("textarea"); ta.value = t; ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;left:-999px;top:0;opacity:0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy"); ta.remove(); return ok;
    } catch (_) { return false; }
  }
  function openRoomPanel() {
    if (!ROOM.active) return;
    if (!panelEl) { buildPanel(); loadLan(); }
    panelEl.hidden = false;
    renderAll();
    requestAnimationFrame(() => requestAnimationFrame(() => panelEl.classList.add("is-open")));
  }
  function closeRoomPanel(immediate) {
    if (!panelEl || panelEl.hidden) return;
    panelEl.classList.remove("is-open");
    const el = panelEl;
    if (immediate) { el.hidden = true; return; }
    setTimeout(() => { if (!el.classList.contains("is-open")) el.hidden = true; }, 420);
  }
  function renderStatus() {
    const t = Rm("status-text");
    if (!t) return;
    t.textContent = STATUS[status] || "";
    Rm("status").dataset.status = status;
  }
  function renderNow() {
    renderBar();
    const n = Rm("now");
    if (!n || !room) return;
    const d = titleOf(room.state.track);
    n.replaceChildren();
    n.appendChild(make("small", "", room.state.playing ? "NOW PLAYING FOR EVERYONE" : (room.state.track ? "PAUSED" : "NOTHING PLAYING YET")));
    n.appendChild(make("strong", "", d.title));
    if (d.artist) n.appendChild(make("span", "", d.artist));
    if (!room.state.track && me && me.role !== "admin") n.appendChild(make("span", "", "Waiting for an admin to pick a song."));
    if (!room.state.track && me && me.role === "admin") n.appendChild(make("span", "", "Pick any song from Home, Search or Library. It plays for the whole room."));
  }
  function renderMembers() {
    const ul = Rm("members");
    if (!ul || !room) return;
    ul.replaceChildren();
    Rm("count").textContent = "(" + room.members.filter((m) => m.online).length + " online)";
    const iAdmin = me && me.role === "admin";
    room.members.forEach((m) => {
      const li = make("li", "zyx-room-member" + (m.online ? "" : " is-away"));
      li.appendChild(make("span", "zyx-room-avatar", (Array.from(m.name)[0] || "?").toUpperCase()));
      const copy = make("span", "zyx-room-mcopy");
      copy.appendChild(make("strong", "", m.name + (me && m.id === me.id ? " (you)" : "")));
      copy.appendChild(make("small", "", (m.owner ? "Owner \u00b7 Admin" : m.role === "admin" ? "Admin" : "Listener") + (m.online ? "" : " \u00b7 away")));
      li.appendChild(copy);
      if (iAdmin && me && m.id !== me.id && !m.owner) {
        const tools = make("span", "zyx-room-mtools");
        const role = make("button", "zyx-room-mbtn", m.role === "admin" ? "Remove admin" : "Make admin");
        role.type = "button"; role.dataset.act = m.role === "admin" ? "demote" : "promote"; role.dataset.id = m.id;
        const kick = make("button", "zyx-room-mbtn is-danger", "Remove");
        kick.type = "button"; kick.dataset.act = "kick"; kick.dataset.id = m.id;
        tools.appendChild(role); tools.appendChild(kick);
        li.appendChild(tools);
      }
      ul.appendChild(li);
    });
  }
  function renderQueue() {
    const box = Rm("queue");
    if (!box || !room) return;
    box.replaceChildren();
    if (!room.queue.length) { box.appendChild(make("p", "zyx-ml-empty", me && me.role === "admin" ? "Nothing queued. Hold a song and choose Add to queue." : "Nothing queued yet.")); return; }
    const iAdmin = me && me.role === "admin";
    const ul = make("ul", "zyx-room-qlist");
    room.queue.forEach((t, i) => {
      const d = titleOf(t);
      const li = make("li", "zyx-room-qitem");
      li.appendChild(make("span", "zyx-row-n", String(i + 1).padStart(2, "0")));
      const copy = make("span", "zyx-room-mcopy");
      copy.appendChild(make("strong", "", d.title));
      copy.appendChild(make("small", "", d.artist || (t.kind === "local" ? "Local collection" : "YouTube")));
      li.appendChild(copy);
      if (iAdmin) {
        const play = make("button", "zyx-room-mbtn", "Play"); play.type = "button"; play.dataset.qact = "play"; play.dataset.i = String(i);
        const rm = make("button", "zyx-room-mbtn is-danger", "Remove"); rm.type = "button"; rm.dataset.qact = "remove"; rm.dataset.i = String(i);
        li.appendChild(play); li.appendChild(rm);
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    if (iAdmin) {
      const c = make("button", "zyx-auth-forgot", "Clear queue"); c.type = "button"; c.dataset.qact = "clear";
      box.appendChild(c);
    }
  }
  function renderAll() {
    root.classList.toggle("is-room-listener", !!(ROOM.active && me && me.role !== "admin"));
    renderBar();
    if (!panelEl || !room || !me) return;
    Rm("code").textContent = room.code;
    Rm("end").hidden = !me.owner;
    Rm("leave").querySelector(".zyx-auth-submit-text").textContent = me.owner ? "Leave (hand over the room)" : "Leave room";
    renderStatus();
    renderNow();
    renderMembers();
    renderQueue();
    renderShare();
  }

  /* listeners cannot scrub the slider (also blocks keyboard changes) */
  const seekrow = document.querySelector(".zyx-seekrow");
  if (seekrow) seekrow.addEventListener("input", (e) => { if (ROOM.active && me && me.role !== "admin") { e.stopPropagation(); say("Only room admins can seek."); } }, true);
  if (seekrow) seekrow.addEventListener("change", () => {
    if (ROOM.active && me && me.role === "admin") send("seek", { pos: app.getState().currentTime || 0 });
  });

  /* ---------- entry points ---------- */
  const open = $("zyx-pt-open");
  if (open) open.addEventListener("click", () => openChooser(""));
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (panelEl && !panelEl.hidden) closeRoomPanel(); else closeChooser();
  });

  (async function init() {
    ensureBar();
    let saved = null;
    try { saved = JSON.parse(sessionStorage.getItem(SKEY)); } catch (_) {}
    if (saved && saved.code && saved.id && saved.token) {
      const r = await api("/join", { code: saved.code, mid: saved.id, token: saved.token });
      if (r.ok) { startSession(r.data.me); return; }
      clearSession();
    }
    const m = /[?&]room=(\d{4})(?:&|$)/.exec(location.search);
    if (m) openChooser("join", m[1]);
  })();
})();
