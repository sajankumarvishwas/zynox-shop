/* ZYNOXIFY MUSIC - accounts UI: log in / create account, forgot-password cats, account menu, online likes */
(function () {
  "use strict";
  const root = document.getElementById("zyx-root");
  const app = window.ZynoxifyMusic;
  if (!root || !app) return;

  const $ = (id) => document.getElementById(id);
  const make = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  function say(text) {
    const live = $("zyx-live");
    if (!live) return;
    live.textContent = "";
    setTimeout(() => { live.textContent = text; }, 40);
  }

  /* ---------- state + API ---------- */
  let user = null;
  let library = null;
  const liked = new Set();
  const listeners = [];
  const notify = () => listeners.forEach((fn) => { try { fn(user); } catch (_) {} });

  async function api(path, body, method) {
    const opts = {
      method: method || (body === undefined ? "GET" : "POST"),
      credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }
    };
    if (opts.method !== "GET") {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body === undefined ? {} : body);
    }
    let res;
    try { res = await fetch("/api/auth" + path, opts); }
    catch (_) { return { ok: false, status: 0, data: { error: { message: "Could not reach the server. Check your connection." } } }; }
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data: data || {} };
  }
  const errText = (r, fallback) => (r && r.data && r.data.error && r.data.error.message) || fallback || "Something went wrong.";

  async function loadLibrary() {
    liked.clear();
    library = null;
    const r = await api("/library");
    if (r.status === 401) { user = null; return; }
    if (r.ok) {
      library = r.data;
      (r.data.likes || []).forEach((t) => liked.add(t.key));
    }
  }
  function refreshHeart() { if (typeof app.refreshLike === "function") app.refreshLike(); }

  function updateAcctBtn() {
    const b = $("zyx-acct");
    if (!b) return;
    b.classList.toggle("is-in", !!user);
    const ini = b.querySelector(".zyx-acct-initial");
    if (ini) ini.textContent = user ? (Array.from(user.name)[0] || "Z").toUpperCase() : "";
    b.setAttribute("aria-label", user ? "Account: " + user.name : "Log in or create an account");
  }

  /* ---------- online likes ---------- */
  function videoId(item) {
    if (!item) return "";
    const direct = item.id || item.providerTrackId;
    if (typeof direct === "string" && /^[A-Za-z0-9_-]{11}$/.test(direct)) return direct;
    const m = typeof item.embedUrl === "string" && item.embedUrl.match(/\/embed\/([A-Za-z0-9_-]{11})$/);
    return m ? m[1] : "";
  }
  async function toggleLike(item) {
    const id = videoId(item);
    if (!id) { say("This song cannot be liked."); return; }
    if (!user) { openAuth("login", "Log in to like songs and keep them on your account.", () => toggleLike(item)); return; }
    const r = await api("/likes/toggle", { track: { kind: "youtube", id: id, title: item.title || "", artist: item.artist || "", artworkUrl: item.artworkUrl || null } });
    if (r.status === 401) { user = null; updateAcctBtn(); openAuth("login", "Your session ended. Log in again.", () => toggleLike(item)); return; }
    if (!r.ok) { say(errText(r)); return; }
    liked.clear();
    (r.data.keys || []).forEach((k) => liked.add(k));
    say(r.data.liked ? "Added to your liked songs" : "Removed from your liked songs");
    refreshHeart();
    notify();
  }
  window.ZynoxifyHooks = {
    isLiked: (item) => { const id = videoId(item); return !!id && liked.has("yt:" + id); },
    toggleLike: toggleLike
  };

  /* ---------- log in / create account overlay ---------- */
  const AUTH_HTML = `
    <div class="zyx-auth-orbs" aria-hidden="true"><i></i><i></i></div>
    <button class="zyx-auth-close" type="button" id="zyx-auth-close" aria-label="Close"><svg class="zyx-ic" aria-hidden="true"><use href="#zi-close"/></svg></button>
    <div class="zyx-auth-scroll">
      <svg class="zyx-auth-art" viewBox="0 0 120 120" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="za-d" cx=".4" cy=".35"><stop offset="0" stop-color="#2f3548"/><stop offset="1" stop-color="#0b0d12"/></radialGradient>
          <linearGradient id="za-l" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7f98"/><stop offset=".55" stop-color="#ff2e55"/><stop offset="1" stop-color="#a4113a"/></linearGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#za-d)"/>
        <g fill="none" stroke="#fff" stroke-opacity=".07"><circle cx="60" cy="60" r="50"/><circle cx="60" cy="60" r="44"/><circle cx="60" cy="60" r="38"/><circle cx="60" cy="60" r="32"/></g>
        <path d="M14 42a50 50 0 0 1 40-27" stroke="#fff" stroke-opacity=".2" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="60" cy="60" r="22" fill="url(#za-l)"/>
        <path d="M52 53h16L52 67h16" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
      <h2 class="zyx-auth-title" id="zyx-auth-title">Welcome back</h2>
      <p class="zyx-auth-sub" id="zyx-auth-sub">Log in to like songs and keep your playlists.</p>
      <div class="zyx-auth-tabs" role="tablist" aria-label="Account">
        <button type="button" role="tab" id="zyx-auth-tab-login" aria-selected="true">Log in</button>
        <button type="button" role="tab" id="zyx-auth-tab-register" aria-selected="false">Create account</button>
      </div>
      <form class="zyx-auth-form" id="zyx-auth-form" novalidate>
        <label class="zyx-auth-field" id="zyx-auth-name-wrap" hidden>
          <span>Your name</span>
          <input id="zyx-auth-name" type="text" maxlength="40" autocomplete="nickname" placeholder="What should we call you?">
        </label>
        <label class="zyx-auth-field">
          <span>Mobile number or email</span>
          <input id="zyx-auth-id" type="text" maxlength="120" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="98765 43210 or you@mail.com">
        </label>
        <label class="zyx-auth-field">
          <span>Password</span>
          <span class="zyx-auth-pw">
            <input id="zyx-auth-pw" type="password" maxlength="128" autocomplete="current-password" placeholder="At least 8 characters">
            <button type="button" class="zyx-auth-eye" id="zyx-auth-eye" aria-label="Show password" aria-pressed="false"><svg class="zyx-ic" aria-hidden="true"><use id="zyx-auth-eye-use" href="#zi-eye"/></svg></button>
          </span>
        </label>
        <p class="zyx-auth-error" id="zyx-auth-error" role="alert" hidden></p>
        <button class="zyx-auth-submit" id="zyx-auth-submit" type="submit"><span class="zyx-auth-submit-text" id="zyx-auth-submit-text">Log in</span><span class="zyx-auth-spin" aria-hidden="true"></span></button>
        <button class="zyx-auth-forgot" id="zyx-auth-forgot" type="button">Forgot password?</button>
      </form>
      <p class="zyx-auth-note">Saved on the server that runs this app. No email or SMS is sent.</p>
    </div>`;

  let authEl = null, authMode = "login", pendingThen = null, busy = false;
  const A = (id) => $("zyx-auth-" + id);

  function showError(text) {
    const e = A("error");
    e.textContent = text || "";
    e.hidden = !text;
  }
  function setMode(mode) {
    authMode = mode;
    const reg = mode === "register";
    A("tab-login").setAttribute("aria-selected", String(!reg));
    A("tab-register").setAttribute("aria-selected", String(reg));
    A("name-wrap").hidden = !reg;
    A("forgot").hidden = reg;
    A("title").textContent = reg ? "Join Zynoxify" : "Welcome back";
    A("sub").textContent = reg ? "Create an account to save likes and playlists." : "Log in to like songs and keep your playlists.";
    A("submit-text").textContent = reg ? "Create account" : "Log in";
    A("pw").setAttribute("autocomplete", reg ? "new-password" : "current-password");
    showError("");
  }
  function buildAuth() {
    authEl = make("div", "zyx-auth");
    authEl.setAttribute("role", "dialog");
    authEl.setAttribute("aria-modal", "true");
    authEl.setAttribute("aria-labelledby", "zyx-auth-title");
    authEl.hidden = true;
    authEl.innerHTML = AUTH_HTML; /* static markup written by us, no user data */
    root.appendChild(authEl);

    A("close").addEventListener("click", closeAuth);
    A("tab-login").addEventListener("click", () => setMode("login"));
    A("tab-register").addEventListener("click", () => setMode("register"));
    A("eye").addEventListener("click", () => {
      const show = A("pw").type === "password";
      A("pw").type = show ? "text" : "password";
      A("eye").setAttribute("aria-pressed", String(show));
      A("eye").setAttribute("aria-label", show ? "Hide password" : "Show password");
      A("eye-use").setAttribute("href", show ? "#zi-eye-off" : "#zi-eye");
    });
    A("forgot").addEventListener("click", openTroll);
    A("form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      const ident = A("id").value.trim();
      const pw = A("pw").value;
      if (!ident || !pw) { showError("Enter your mobile number or email, and your password."); return; }
      if (authMode === "register" && pw.length < 8) { showError("Your password needs at least 8 characters."); return; }
      busy = true;
      A("submit").disabled = true;
      A("submit").classList.add("is-busy");
      showError("");
      const r = await api(authMode === "register" ? "/register" : "/login",
        { identifier: ident, password: pw, name: A("name").value });
      busy = false;
      A("submit").disabled = false;
      A("submit").classList.remove("is-busy");
      if (!r.ok || !r.data.user) { showError(errText(r)); return; }
      user = r.data.user;
      A("pw").value = "";
      await loadLibrary();
      updateAcctBtn();
      closeAuth(true);
      say((authMode === "register" ? "Welcome to Zynoxify, " : "Welcome back, ") + user.name);
      refreshHeart();
      notify();
      if (pendingThen) { const f = pendingThen; pendingThen = null; f(); }
    });
  }
  function openAuth(mode, reason, then) {
    if (!authEl) buildAuth();
    pendingThen = then || null;
    setMode(mode || "login");
    if (reason) A("sub").textContent = reason;
    authEl.hidden = false;
    root.classList.add("is-auth-open");
    requestAnimationFrame(() => requestAnimationFrame(() => authEl.classList.add("is-open")));
    setTimeout(() => { if (!authEl.hidden) A("id").focus({ preventScroll: true }); }, 380);
  }
  function closeAuth(keepPending) {
    if (!authEl || authEl.hidden) return;
    if (keepPending !== true) pendingThen = null;
    authEl.classList.remove("is-open");
    root.classList.remove("is-auth-open");
    setTimeout(() => { if (!authEl.classList.contains("is-open")) authEl.hidden = true; }, 420);
  }

  /* ---------- forgot password: two cats ---------- */
  const TROLL_HTML = `
    <div class="zyx-auth-orbs" aria-hidden="true"><i></i><i></i></div>
    <div class="zyx-troll-scroll">
      <div class="zyx-troll-stage">
        <p class="zyx-bubble zyx-bubble--a">Forgot your password?</p>
        <p class="zyx-bubble zyx-bubble--b">Skill issue.</p>
        <p class="zyx-bubble zyx-bubble--c">Reset? Knocked it off the table.</p>
        <svg class="zc" viewBox="0 0 360 230" role="img" aria-label="Two cats. One pushes a mug labelled PASS off a table while the other watches it fall.">
          <defs>
            <linearGradient id="zc-o" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffbe7a"/><stop offset="1" stop-color="#f08a3c"/></linearGradient>
            <linearGradient id="zc-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcc5db"/><stop offset="1" stop-color="#7f89a3"/></linearGradient>
            <linearGradient id="zc-t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b5169"/><stop offset="1" stop-color="#2a2f42"/></linearGradient>
          </defs>
          <ellipse cx="180" cy="225" rx="172" ry="7" fill="#000" opacity=".35"/>
          <rect x="14" y="170" width="238" height="12" rx="6" fill="url(#zc-t)"/>
          <rect x="34" y="180" width="10" height="43" rx="3" fill="#2a2f42"/>
          <rect x="222" y="180" width="10" height="43" rx="3" fill="#2a2f42"/>

          <g class="zc-tail1"><path d="M54 158C20 160 12 126 34 112" fill="none" stroke="url(#zc-o)" stroke-width="12" stroke-linecap="round"/></g>
          <ellipse cx="88" cy="150" rx="34" ry="22" fill="url(#zc-o)"/>
          <path d="M82 90L86 62L103 81Z" fill="url(#zc-o)"/><path d="M124 90L120 62L103 81Z" fill="url(#zc-o)"/>
          <path d="M87 82L88 71L96 80Z" fill="#ff9aa8"/><path d="M119 82L118 71L110 80Z" fill="#ff9aa8"/>
          <circle cx="103" cy="108" r="27" fill="url(#zc-o)"/>
          <path d="M96 84v9M103 82v10M110 84v9" stroke="#d9722a" stroke-width="3" stroke-linecap="round"/>
          <g class="zc-eyes zc-eyes1"><ellipse cx="93" cy="107" rx="6.5" ry="7.5" fill="#fff"/><ellipse cx="113" cy="107" rx="6.5" ry="7.5" fill="#fff"/>
            <g class="zc-pup1"><circle cx="95.5" cy="108" r="3.5" fill="#1b1d28"/><circle cx="115.5" cy="108" r="3.5" fill="#1b1d28"/></g></g>
          <path d="M100 117h6l-3 4z" fill="#ff7a8a"/>
          <path d="M103 121v3M97 126q6 4 12 0" stroke="#7a3a14" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M79 117l-14-3M79 121l-14 2M127 117l14-3M127 121l14 2" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>
          <g class="zc-paw"><rect x="112" y="141" width="62" height="13" rx="6.5" fill="url(#zc-o)"/><circle cx="174" cy="147.5" r="8" fill="#ffd2a3"/></g>

          <g class="zc-mug">
            <rect x="186" y="144" width="24" height="26" rx="5" fill="#ff2e55"/>
            <path d="M210 150h5a6 6 0 0 1 0 13h-5" fill="none" stroke="#ff2e55" stroke-width="4"/>
            <rect x="190" y="152" width="16" height="10" rx="2" fill="#fff" opacity=".92"/>
            <text x="198" y="160" font-size="6.5" font-weight="800" text-anchor="middle" fill="#a4113a" font-family="system-ui,sans-serif">PASS</text>
          </g>

          <g class="zc-tail2"><path d="M298 208C338 212 350 184 332 170" fill="none" stroke="url(#zc-g)" stroke-width="11" stroke-linecap="round"/></g>
          <ellipse cx="316" cy="199" rx="30" ry="23" fill="url(#zc-g)"/>
          <path d="M296 162L298 135L315 151Z" fill="url(#zc-g)"/><path d="M336 162L334 135L317 151Z" fill="url(#zc-g)"/>
          <path d="M299 152L300 142L307 150Z" fill="#ff9aa8"/><path d="M333 152L332 142L325 150Z" fill="#ff9aa8"/>
          <circle cx="316" cy="170" r="25" fill="url(#zc-g)"/>
          <path d="M310 148v8M316 147v9M322 148v8" stroke="#8d97b2" stroke-width="2.6" stroke-linecap="round"/>
          <g class="zc-eyes zc-eyes2"><ellipse cx="307" cy="169" rx="6" ry="7" fill="#fff"/><ellipse cx="326" cy="169" rx="6" ry="7" fill="#fff"/>
            <g class="zc-pup2"><circle cx="305" cy="170" r="3.3" fill="#1b1d28"/><circle cx="324" cy="170" r="3.3" fill="#1b1d28"/></g></g>
          <path d="M313 178h6l-3 4z" fill="#ff7a8a"/>
          <path d="M316 182v3M311 187q5 3 10 0" stroke="#4d556b" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <path d="M295 178l-13-3M295 182l-13 2M337 178l13-3M337 182l13 2" stroke="#fff" stroke-opacity=".7" stroke-width="1.2" stroke-linecap="round"/>

          <g class="zc-crash">
            <rect x="253" y="201" width="22" height="22" fill="#ffd34d" transform="rotate(20 264 212)"/>
            <rect x="253" y="201" width="22" height="22" fill="#ffb02e" transform="rotate(65 264 212)"/>
            <text x="264" y="194" text-anchor="middle" font-size="12" font-weight="900" fill="#ffd34d" font-family="system-ui,sans-serif">CRASH</text>
          </g>
        </svg>
      </div>
      <h2 class="zyx-troll-title">Password reset</h2>
      <p class="zyx-troll-text">Our cats knocked it off the table. Seriously though: there is no reset yet, so try to remember it, or start fresh with a new account.</p>
      <div class="zyx-troll-actions">
        <button class="zyx-auth-submit" id="zyx-troll-back" type="button"><span class="zyx-auth-submit-text">Back to log in</span></button>
        <button class="zyx-auth-forgot" id="zyx-troll-new" type="button">Create a new account instead</button>
      </div>
    </div>`;
  let trollEl = null;
  function openTroll() {
    if (!trollEl) {
      trollEl = make("div", "zyx-troll");
      trollEl.setAttribute("role", "dialog");
      trollEl.setAttribute("aria-modal", "true");
      trollEl.setAttribute("aria-label", "Password reset");
      trollEl.hidden = true;
      trollEl.innerHTML = TROLL_HTML; /* static markup written by us, no user data */
      root.appendChild(trollEl);
      $("zyx-troll-back").addEventListener("click", closeTroll);
      $("zyx-troll-new").addEventListener("click", () => { closeTroll(); setMode("register"); });
    }
    trollEl.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => trollEl.classList.add("is-open")));
  }
  function closeTroll() {
    if (!trollEl || trollEl.hidden) return;
    trollEl.classList.remove("is-open");
    setTimeout(() => { if (!trollEl.classList.contains("is-open")) trollEl.hidden = true; }, 380);
  }

  /* ---------- account menu ---------- */
  let menuEl = null;
  function closeMenu() {
    if (!menuEl) return;
    menuEl.classList.remove("is-open");
    const el = menuEl;
    menuEl = null;
    setTimeout(() => el.remove(), 360);
  }
  function openMenu() {
    if (!user || menuEl) return;
    const wrap = make("div", "zyx-acctmenu");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Your account");
    const scrim = make("div", "zyx-acctmenu-scrim");
    scrim.addEventListener("click", closeMenu);
    const card = make("div", "zyx-acctmenu-card");
    const head = make("div", "zyx-acctmenu-head");
    head.appendChild(make("span", "zyx-acctmenu-avatar", (Array.from(user.name)[0] || "Z").toUpperCase()));
    const who = make("div", "zyx-acctmenu-who");
    who.appendChild(make("strong", "", user.name));
    who.appendChild(make("small", "", user.hint));
    head.appendChild(who);
    card.appendChild(head);
    const stats = make("p", "zyx-acctmenu-stats");
    const likeCount = liked.size;
    const plCount = library && Array.isArray(library.playlists) ? library.playlists.length : 0;
    stats.textContent = likeCount + (likeCount === 1 ? " liked song" : " liked songs") + " \u00b7 " + plCount + (plCount === 1 ? " playlist" : " playlists");
    card.appendChild(stats);

    const out = make("button", "zyx-auth-submit zyx-auth-submit--soft");
    out.type = "button";
    out.appendChild(make("span", "zyx-auth-submit-text", "Log out"));
    out.addEventListener("click", async () => {
      await api("/logout", {});
      user = null; library = null; liked.clear();
      updateAcctBtn(); closeMenu(); say("Logged out"); refreshHeart(); notify();
    });
    card.appendChild(out);

    const del = make("button", "zyx-auth-forgot zyx-acctmenu-del", "Delete my account");
    del.type = "button";
    const delBox = make("div", "zyx-acctmenu-delbox");
    delBox.hidden = true;
    const pwIn = make("input");
    pwIn.type = "password"; pwIn.placeholder = "Enter your password to confirm"; pwIn.maxLength = 128;
    pwIn.autocomplete = "current-password"; pwIn.className = "zyx-acctmenu-input";
    pwIn.setAttribute("aria-label", "Password to confirm deleting your account");
    const delGo = make("button", "zyx-auth-submit zyx-auth-submit--danger");
    delGo.type = "button";
    delGo.appendChild(make("span", "zyx-auth-submit-text", "Delete forever"));
    const delErr = make("p", "zyx-auth-error");
    delErr.setAttribute("role", "alert"); delErr.hidden = true;
    delBox.appendChild(pwIn); delBox.appendChild(delErr); delBox.appendChild(delGo);
    del.addEventListener("click", () => { delBox.hidden = !delBox.hidden; if (!delBox.hidden) pwIn.focus(); });
    delGo.addEventListener("click", async () => {
      if (!pwIn.value) { delErr.textContent = "Enter your password."; delErr.hidden = false; return; }
      const r = await api("/delete-account", { password: pwIn.value });
      if (!r.ok) { delErr.textContent = errText(r); delErr.hidden = false; return; }
      user = null; library = null; liked.clear();
      updateAcctBtn(); closeMenu(); say("Your account was deleted"); refreshHeart(); notify();
    });
    card.appendChild(del);
    card.appendChild(delBox);

    wrap.appendChild(scrim);
    wrap.appendChild(card);
    root.appendChild(wrap);
    menuEl = wrap;
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add("is-open")));
  }

  /* ---------- wiring ---------- */
  const acct = $("zyx-acct");
  if (acct) acct.addEventListener("click", () => { if (user) openMenu(); else openAuth("login"); });

  const chip = document.querySelector(".zyx-head .zyx-chip");
  if (chip) {
    chip.setAttribute("role", "button");
    chip.tabIndex = 0;
    const tell = () => say(chip.title || (document.getElementById("zyx-status-text") || {}).textContent || "");
    chip.addEventListener("click", tell);
    chip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tell(); } });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (trollEl && !trollEl.hidden) closeTroll();
    else if (authEl && !authEl.hidden) closeAuth();
    else closeMenu();
  });

  window.ZynoxifyAccount = {
    getUser: () => user,
    getLibrary: () => library,
    reloadLibrary: async () => { await loadLibrary(); notify(); return library; },
    requireLogin: (reason, then) => { if (user) { then && then(); return true; } openAuth("login", reason, then); return false; },
    openAuth: openAuth,
    api: api,
    onChange: (fn) => { listeners.push(fn); }
  };

  (async function init() {
    updateAcctBtn();
    const r = await api("/me");
    user = r.ok && r.data.user ? r.data.user : null;
    updateAcctBtn();
    if (user) await loadLibrary();
    updateAcctBtn();
    refreshHeart();
    notify();
  })();
})();
