/* ZYNOXIFY MUSIC - playlists, liked songs, link import and "Add to playlist" */
(function () {
  "use strict";
  const root = document.getElementById("zyx-root");
  const app = window.ZynoxifyMusic;
  const acct = window.ZynoxifyAccount;
  const pane = document.getElementById("zyx-pane-library");
  if (!root || !app || !acct || !pane || typeof app.playEntries !== "function") return;

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
  const EMBED = /^https:\/\/www\.youtube\.com\/embed\/([A-Za-z0-9_-]{11})$/;
  const songs = app.getSongs();
  const lib = () => acct.getLibrary() || { likes: [], playlists: [] };
  const errText = (r) => (r && r.data && r.data.error && r.data.error.message) || "Something went wrong.";
  const plural = (n, one, many) => n + " " + (n === 1 ? one : many);

  /* ---------- track helpers ---------- */
  function entryOf(t) {
    if (!t) return null;
    if (t.kind === "local") {
      const idx = songs.findIndex((s) => s.file === t.file);
      return idx < 0 ? null : { kind: "local", idx: idx };
    }
    if (t.kind === "youtube" && typeof t.embedUrl === "string" && EMBED.test(t.embedUrl)) return { kind: "online", item: t };
    return null;
  }
  function labelOf(t) {
    if (t.kind === "local") {
      const s = songs.find((x) => x.file === t.file) || {};
      return { title: s.title || "Local song", artist: s.artist || "", art: null };
    }
    return { title: t.title || "Saved video", artist: t.artist || "", art: typeof t.artworkUrl === "string" && /^https:\/\//i.test(t.artworkUrl) ? t.artworkUrl : null };
  }
  function payloadOf(entry) {
    if (!entry) return null;
    if (entry.kind === "local") { const s = songs[entry.idx]; return s ? { kind: "local", file: s.file } : null; }
    const it = entry.item || {};
    const m = typeof it.embedUrl === "string" && it.embedUrl.match(EMBED);
    return m ? { kind: "youtube", id: m[1], title: it.title || "", artist: it.artist || "", artworkUrl: it.artworkUrl || null } : null;
  }
  function thumb(label) {
    const t = make("span", "zyx-ml-thumb");
    t.appendChild(make("span", "", (Array.from(label.title).find((c) => /[\p{L}\p{N}]/u.test(c)) || "Z").toUpperCase()));
    if (label.art) {
      const img = document.createElement("img");
      img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = label.art;
      t.appendChild(img);
    }
    return t;
  }
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; }
    return a;
  }

  /* ---------- panel (third segment of the Library sheet) ---------- */
  let panelOpen = false, view = { type: "home" }, formOpen = null, formMsg = "", busy = false, renaming = false, confirmDel = false;
  const mylib = make("div", "zyx-scroll zyx-ml");
  mylib.id = "zyx-mylib";
  mylib.hidden = true;
  pane.appendChild(mylib);

  function setPanel(on) {
    panelOpen = on;
    mylib.hidden = !on;
    Array.from(pane.children).forEach((c) => {
      if (c !== mylib) c.classList.toggle("zyx-ml-hide", on && !c.matches("fieldset"));
    });
    if (on) render();
  }
  pane.addEventListener("change", (e) => {
    if (!e.target || e.target.name !== "zyx-show") return;
    const sel = pane.querySelector('input[name="zyx-show"]:checked');
    setPanel(!!sel && sel.value === "lists");
  });

  async function reload() {
    await acct.reloadLibrary();
    if (typeof app.refreshLike === "function") app.refreshLike();
    render();
  }
  function btn(label, sym, onClick, cls) {
    const b = make("button", "zyx-ml-btn" + (cls ? " " + cls : ""));
    b.type = "button";
    b.appendChild(icon(sym));
    b.appendChild(make("span", "", label));
    b.addEventListener("click", onClick);
    return b;
  }
  function card(sym, title, sub, onClick, art) {
    const c = make("button", "zyx-ml-card");
    c.type = "button";
    const a = make("span", "zyx-ml-cardart" + (art ? " " + art : ""));
    a.appendChild(icon(sym));
    c.appendChild(a);
    const copy = make("span", "zyx-ml-cardcopy");
    copy.appendChild(make("strong", "", title));
    copy.appendChild(make("small", "", sub));
    c.appendChild(copy);
    c.appendChild(icon("zi-chev"));
    c.addEventListener("click", onClick);
    return c;
  }
  function textForm(placeholder, submitLabel, onSubmit, opts) {
    opts = opts || {};
    const f = make("form", "zyx-ml-form");
    f.noValidate = true;
    const input = make("input", "zyx-ml-input");
    input.type = opts.type || "text";
    input.placeholder = placeholder;
    input.maxLength = opts.max || 200;
    input.value = opts.value || "";
    input.autocomplete = "off";
    input.setAttribute("aria-label", placeholder);
    const go = make("button", "zyx-ml-go");
    go.type = "submit";
    go.textContent = busy && opts.busyLabel ? opts.busyLabel : submitLabel;
    go.disabled = busy;
    f.appendChild(input);
    f.appendChild(go);
    if (opts.hint) f.appendChild(make("p", "zyx-ml-hint", opts.hint));
    if (formMsg) { const m = make("p", "zyx-auth-error", formMsg); m.setAttribute("role", "alert"); f.appendChild(m); }
    f.addEventListener("submit", (e) => { e.preventDefault(); if (!busy) onSubmit(input.value.trim()); });
    return f;
  }

  function render() {
    if (!panelOpen) return;
    mylib.replaceChildren();
    if (!acct.getUser()) {
      const s = make("div", "zyx-state");
      s.appendChild(make("strong", "", "Log in to use playlists"));
      s.appendChild(document.createTextNode("Create playlists, import them from a YouTube link and keep your liked songs on your account."));
      const b = make("button", "zyx-btn zyx-btn--accent", "Log in");
      b.type = "button";
      b.addEventListener("click", () => acct.openAuth("login", "Log in to create playlists and see your liked songs."));
      s.appendChild(b);
      mylib.appendChild(s);
      return;
    }
    if (view.type === "home") renderHome(); else renderDetail();
  }

  function toggleForm(name) { formOpen = formOpen === name ? null : name; formMsg = ""; render(); }

  function renderHome() {
    const L = lib();
    const actions = make("div", "zyx-ml-actions");
    actions.appendChild(btn("New playlist", "zi-plus", () => toggleForm("new"), formOpen === "new" ? "is-on" : ""));
    actions.appendChild(btn("Import link", "zi-link", () => toggleForm("import"), formOpen === "import" ? "is-on" : ""));
    mylib.appendChild(actions);
    if (formOpen === "new") {
      mylib.appendChild(textForm("Playlist name", "Create", async (name) => {
        if (!name) { formMsg = "Give the playlist a name."; render(); return; }
        busy = true; formMsg = ""; render();
        const r = await acct.api("/playlists", { name: name });
        busy = false;
        if (!r.ok) { formMsg = errText(r); render(); return; }
        formOpen = null;
        await acct.reloadLibrary();
        view = { type: "list", id: r.data.playlist.id };
        say("Created playlist " + r.data.playlist.name);
        render();
      }, { max: 60 }));
    }
    if (formOpen === "import") {
      mylib.appendChild(textForm("YouTube or YouTube Music link", "Import", async (url) => {
        if (!url) { formMsg = "Paste a playlist link first."; render(); return; }
        busy = true; formMsg = ""; render();
        const r = await acct.api("/import", { url: url });
        busy = false;
        if (!r.ok) { formMsg = errText(r); render(); return; }
        formOpen = null;
        await acct.reloadLibrary();
        view = { type: "list", id: r.data.playlist.id };
        say("Imported " + r.data.playlist.name + " (" + plural(r.data.playlist.count, "song", "songs") + ")");
        render();
      }, { type: "url", max: 300, busyLabel: "Importing...", hint: "Works with YouTube and YouTube Music playlist links. Spotify and other services cannot be imported." }));
    }
    mylib.appendChild(card("zi-heart", "Liked songs", plural(L.likes.length, "song", "songs"), () => { view = { type: "likes" }; render(); }, "is-liked"));
    if (!L.playlists.length) {
      mylib.appendChild(make("p", "zyx-ml-empty", "No playlists yet. Create one, or import a playlist from a YouTube link."));
    }
    L.playlists.forEach((p) => {
      mylib.appendChild(card("zi-list", p.name, plural(p.tracks.length, "song", "songs"), () => {
        view = { type: "list", id: p.id }; renaming = false; confirmDel = false; render();
      }));
    });
  }

  function renderDetail() {
    const L = lib();
    let title, tracks, pl = null;
    if (view.type === "likes") { title = "Liked songs"; tracks = L.likes; }
    else {
      pl = L.playlists.find((p) => p.id === view.id);
      if (!pl) { view = { type: "home" }; render(); return; }
      title = pl.name; tracks = pl.tracks;
    }
    const head = make("div", "zyx-ml-head");
    const back = make("button", "zyx-ml-iconbtn");
    back.type = "button";
    back.setAttribute("aria-label", "Back to playlists");
    back.appendChild(icon("zi-back"));
    back.addEventListener("click", () => { view = { type: "home" }; renaming = false; confirmDel = false; render(); });
    head.appendChild(back);
    const ttl = make("div", "zyx-ml-ttl");
    ttl.appendChild(make("h3", "", title));
    ttl.appendChild(make("small", "", plural(tracks.length, "song", "songs")));
    head.appendChild(ttl);
    if (pl) {
      const ed = make("button", "zyx-ml-iconbtn");
      ed.type = "button"; ed.setAttribute("aria-label", "Rename playlist"); ed.appendChild(icon("zi-edit"));
      ed.addEventListener("click", () => { renaming = !renaming; confirmDel = false; formMsg = ""; render(); });
      const del = make("button", "zyx-ml-iconbtn");
      del.type = "button"; del.setAttribute("aria-label", "Delete playlist"); del.appendChild(icon("zi-trash"));
      del.addEventListener("click", () => { confirmDel = !confirmDel; renaming = false; render(); });
      head.appendChild(ed); head.appendChild(del);
    }
    mylib.appendChild(head);

    if (renaming && pl) {
      mylib.appendChild(textForm("Playlist name", "Save", async (name) => {
        if (!name) { formMsg = "Give the playlist a name."; render(); return; }
        busy = true; render();
        const r = await acct.api("/playlists/" + pl.id, { name: name }, "PATCH");
        busy = false;
        if (!r.ok) { formMsg = errText(r); render(); return; }
        renaming = false; formMsg = "";
        await reload();
      }, { max: 60, value: pl.name }));
    }
    if (confirmDel && pl) {
      const box = make("div", "zyx-ml-confirm");
      box.appendChild(make("p", "", "Delete \u201c" + pl.name + "\u201d? The songs themselves are not deleted."));
      const row = make("div", "zyx-ml-confirm-row");
      const no = make("button", "zyx-btn", "Keep it"); no.type = "button";
      no.addEventListener("click", () => { confirmDel = false; render(); });
      const yes = make("button", "zyx-btn zyx-ml-danger", "Delete"); yes.type = "button";
      yes.addEventListener("click", async () => {
        const r = await acct.api("/playlists/" + pl.id, {}, "DELETE");
        if (!r.ok) { say(errText(r)); return; }
        confirmDel = false; view = { type: "home" };
        say("Playlist deleted");
        await reload();
      });
      row.appendChild(no); row.appendChild(yes); box.appendChild(row);
      mylib.appendChild(box);
    }

    const entries = tracks.map(entryOf);
    const playable = entries.filter(Boolean);
    const play = make("div", "zyx-ml-playrow");
    const all = btn("Play all", "zi-play", () => startPlayback(playable), "zyx-ml-btn--accent");
    const shuf = btn("Shuffle", "zi-shuffle", () => startPlayback(shuffled(playable)), "");
    all.disabled = shuf.disabled = !playable.length;
    play.appendChild(all); play.appendChild(shuf);
    mylib.appendChild(play);

    if (!tracks.length) {
      mylib.appendChild(make("p", "zyx-ml-empty", pl ? "This playlist is empty. Hold a song and choose Add to playlist." : "Songs you like will appear here."));
      return;
    }
    const ul = make("ul", "zyx-ml-tracks");
    tracks.forEach((t, i) => {
      const li = make("li", "zyx-ml-track");
      const d = labelOf(t);
      const main = make("button", "zyx-ml-trackmain");
      main.type = "button";
      main.appendChild(thumb(d));
      const copy = make("span", "zyx-ml-trackcopy");
      copy.appendChild(make("strong", "", d.title));
      copy.appendChild(make("small", "", d.artist || (t.kind === "local" ? "Local collection" : "YouTube")));
      main.appendChild(copy);
      main.addEventListener("click", () => {
        if (!entries[i]) { say("This song is no longer available."); return; }
        startPlayback(entries.slice(i).filter(Boolean));
      });
      li.appendChild(main);
      const rm = make("button", "zyx-icon-btn");
      rm.type = "button";
      rm.setAttribute("aria-label", (pl ? "Remove from playlist: " : "Remove from liked songs: ") + d.title);
      rm.appendChild(icon("zi-close"));
      rm.addEventListener("click", async () => {
        let r;
        if (pl) r = await acct.api("/playlists/" + pl.id + "/tracks/remove", { key: t.key });
        else r = await acct.api("/likes/toggle", { track: { kind: t.kind, id: t.id, file: t.file, title: t.title, artist: t.artist, artworkUrl: t.artworkUrl } });
        if (!r.ok) { say(errText(r)); return; }
        say(pl ? "Removed from playlist" : "Removed from liked songs");
        await reload();
      });
      li.appendChild(rm);
      ul.appendChild(li);
    });
    mylib.appendChild(ul);
  }

  function startPlayback(list) {
    if (!list.length) return;
    if (app.playEntries(list) && typeof app.closeSheet === "function") app.closeSheet();
  }

  acct.onChange(() => {
    if (!acct.getUser()) { view = { type: "home" }; formOpen = null; renaming = false; confirmDel = false; }
    render();
  });

  /* ---------- Add to playlist (from the track options menu) ---------- */
  let pickEl = null;
  function closePicker() {
    if (!pickEl) return;
    const el = pickEl;
    pickEl = null;
    el.classList.remove("is-open");
    setTimeout(() => el.remove(), 340);
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePicker(); });

  async function addTo(plId, plName, payload) {
    const r = await acct.api("/playlists/" + plId + "/tracks", { track: payload });
    if (!r.ok) { say(errText(r)); return; }
    say(r.data.added ? "Added to " + plName : "Already in " + plName);
    closePicker();
    await acct.reloadLibrary();
    render();
  }
  function openPicker(entry) {
    if (pickEl) return;
    if (!acct.getUser()) { acct.requireLogin("Log in to create playlists.", () => openPicker(entry)); return; }
    const payload = payloadOf(entry);
    if (!payload) { say("This song cannot be added to a playlist."); return; }
    const wrap = make("div", "zyx-tmenu");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Add to playlist");
    const scrim = make("div", "zyx-tmenu-scrim");
    scrim.addEventListener("click", closePicker);
    const card2 = make("div", "zyx-tmenu-card");
    card2.appendChild(make("span", "zyx-tmenu-grab"));
    card2.appendChild(make("h3", "zyx-pick-title", "Add to playlist"));
    const list = make("div", "zyx-tmenu-list zyx-pick-list");
    lib().playlists.forEach((p) => {
      const b = make("button", "zyx-tmenu-act");
      b.type = "button";
      b.appendChild(icon("zi-list"));
      const t = make("span", "zyx-pick-name", p.name);
      b.appendChild(t);
      b.appendChild(make("small", "zyx-pick-count", plural(p.tracks.length, "song", "songs")));
      b.addEventListener("click", () => addTo(p.id, p.name, payload));
      list.appendChild(b);
    });
    card2.appendChild(list);
    const f = make("form", "zyx-ml-form zyx-pick-new");
    f.noValidate = true;
    const input = make("input", "zyx-ml-input");
    input.type = "text"; input.maxLength = 60; input.placeholder = "New playlist name"; input.autocomplete = "off";
    input.setAttribute("aria-label", "New playlist name");
    const go = make("button", "zyx-ml-go");
    go.type = "submit"; go.textContent = "Create + add";
    const err = make("p", "zyx-auth-error"); err.hidden = true; err.setAttribute("role", "alert");
    f.appendChild(input); f.appendChild(go); f.appendChild(err);
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = input.value.trim();
      if (!name) { err.textContent = "Give the playlist a name."; err.hidden = false; return; }
      go.disabled = true;
      const r = await acct.api("/playlists", { name: name });
      if (!r.ok) { go.disabled = false; err.textContent = errText(r); err.hidden = false; return; }
      await addTo(r.data.playlist.id, r.data.playlist.name, payload);
    });
    card2.appendChild(f);
    wrap.appendChild(scrim);
    wrap.appendChild(card2);
    root.appendChild(wrap);
    pickEl = wrap;
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-open")));
  }
  if (window.ZynoxifyMenu && typeof window.ZynoxifyMenu.registerAction === "function") {
    window.ZynoxifyMenu.registerAction((entry) => payloadOf(entry) ? { label: "Add to playlist", icon: "zi-plus", run: () => openPicker(entry) } : null);
  }
})();
