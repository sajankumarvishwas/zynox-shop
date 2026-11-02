(function () {
  "use strict";
  const root = document.getElementById("zyx-root");
  const app = window.ZynoxifyMusic;
  if (!root || !app) {
    console.error("Zynoxify Home: player bridge unavailable.");
    return;
  }

  const $ = id => document.getElementById(id);
  const pager = $("zyx-home-pager");
  const pages = $("zyx-home-pages");
  const count = $("zyx-home-page-count");
  const dots = $("zyx-home-dots");
  const miniCover = $("zyx-mini-cover");
  const miniTitle = $("zyx-mini-title");
  const miniArtist = $("zyx-mini-artist");
  const miniPlay = $("zyx-mini-play");
  const miniPlayIcon = $("zyx-mini-play-icon");
  const miniNext = $("zyx-mini-next");
  const miniOpen = $("zyx-mini-open");
  const mini = $("zyx-mini-player");
  const home = $("zyx-home-view");

  if (!pager || !pages || !count || !mini || !home) return;

  const moodQueries = {
    "": [
      "Arijit Singh official video", "The Weeknd official music video", "new hindi song official video 2026",
      "Taylor Swift official music video", "Diljit Dosanjh official music video", "Dua Lipa official video"
    ],
    "trending india": [
      "new hindi song official video 2026", "new punjabi song official video 2026", "Arijit Singh latest song official video",
      "new bollywood song official video", "new tamil song official video 2026", "new telugu song official video 2026"
    ],
    "global hits": [
      "The Weeknd official music video", "Taylor Swift official music video", "Dua Lipa official video",
      "Billie Eilish official video", "Bruno Mars official video", "new english pop song official video 2026"
    ],
    "bollywood": [
      "new bollywood song official video", "Arijit Singh official video", "Shreya Ghoshal official video",
      "Pritam official video song", "Jubin Nautiyal official video", "bollywood romantic song official video"
    ],
    "punjabi": [
      "Diljit Dosanjh official music video", "AP Dhillon official video", "Karan Aujla official video",
      "Sidhu Moose Wala official video", "Shubh official music video", "new punjabi song official video 2026"
    ],
    "gaming music": [
      "NoCopyrightSounds official video", "Imagine Dragons official video", "Alan Walker official video",
      "Martin Garrix official video", "Eminem official music video", "phonk official audio gaming"
    ],
    "phonk music": [
      "phonk official audio", "brazilian phonk official audio", "drift phonk official video",
      "Kordhell Murder In My Mind", "phonk song official music video", "aggressive phonk official audio"
    ],
    "focus music": [
      "lofi official audio single", "instrumental focus official audio", "piano focus official audio",
      "ambient official audio single", "Ludovico Einaudi official video", "chillhop official audio"
    ],
    "chill music": [
      "chill pop official video", "acoustic chill official video", "Anuv Jain official video",
      "Arijit Singh slow song official video", "Ed Sheeran official video", "Coldplay official video"
    ],
    "workout music": [
      "workout song official video", "Eminem official music video", "gym motivation song official video",
      "Imagine Dragons official video", "Badshah official video", "Yo Yo Honey Singh official video"
    ],
    "romantic songs": [
      "romantic hindi song official video", "Arijit Singh romantic official video", "Jubin Nautiyal romantic official video",
      "romantic english song official video", "Ed Sheeran romantic official video", "Atif Aslam official video"
    ],
    "night drive music": [
      "The Weeknd official video", "synthwave official audio", "night drive phonk official audio",
      "Post Malone official video", "Arijit Singh slow song official video", "midnight pop official video"
    ],
    "energy music": [
      "Alan Walker official video", "Martin Garrix official video", "David Guetta official video",
      "Badshah official music video", "Yo Yo Honey Singh official video", "Imagine Dragons official video"
    ]
  };

  const CACHE_TTL = 30 * 60 * 1000;
  const indiaPool = [
    "Arijit Singh official video", "Diljit Dosanjh official music video", "AP Dhillon official video",
    "Karan Aujla official video", "Badshah official music video", "Shreya Ghoshal official video",
    "Jubin Nautiyal official video", "Anuv Jain official video", "new hindi song official video 2026",
    "new punjabi song official video 2026"
  ];
  const worldPool = [
    "The Weeknd official music video", "Taylor Swift official music video", "Dua Lipa official video",
    "Billie Eilish official video", "Bruno Mars official video", "Imagine Dragons official video",
    "Sabrina Carpenter official video", "Post Malone official video", "Coldplay official video",
    "Ed Sheeran official video", "new english pop song official video 2026"
  ];
  function shuffled(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function recentArtists() {
    try {
      const list = JSON.parse(localStorage.getItem("zynoxify:artists"));
      return Array.isArray(list) ? list.filter(s => typeof s === "string").slice(0, 2) : [];
    } catch (_) { return []; }
  }
  function rememberArtist(name) {
    const a = String(name || "").replace(/\s*-\s*topic$/i, "").replace(/vevo$/i, "").trim();
    if (!a || a.length > 40 || /youtube/i.test(a)) return;
    try {
      const list = JSON.parse(localStorage.getItem("zynoxify:artists")) || [];
      const next = [a].concat(list.filter(x => x !== a)).slice(0, 8);
      localStorage.setItem("zynoxify:artists", JSON.stringify(next));
    } catch (_) {}
  }
  function pickForYou() {
    try {
      const saved = JSON.parse(localStorage.getItem("zynoxify:foryou2"));
      if (saved && Date.now() - saved.t < CACHE_TTL && Array.isArray(saved.q) &&
          saved.q.length === 6 && saved.q.every(s => typeof s === "string")) return saved.q;
    } catch (_) {}
    const mine = recentArtists().map(a => a + " official video");
    const rest = 6 - mine.length;
    const picked = shuffled(
      shuffled(indiaPool).slice(0, Math.ceil(rest / 2))
        .concat(shuffled(worldPool).slice(0, Math.floor(rest / 2)))
        .concat(mine)
    );
    try { localStorage.setItem("zynoxify:foryou2", JSON.stringify({ t: Date.now(), q: picked })); } catch (_) {}
    return picked;
  }
  moodQueries[""] = pickForYou();

  function readCached(query) {
    try {
      const raw = JSON.parse(localStorage.getItem("zynoxify:rc:" + query));
      if (!raw || Date.now() - raw.t > CACHE_TTL) return null;
      const items = visibleItems({ items: raw.items });
      return items.length ? items : null;
    } catch (_) { return null; }
  }
  function writeCached(query, items) {
    try { localStorage.setItem("zynoxify:rc:" + query, JSON.stringify({ t: Date.now(), items: items })); } catch (_) {}
  }

  let closingTimer = 0;
  function openPlayer() {
    clearTimeout(closingTimer);
    root.classList.remove("is-player-closing");
    root.classList.add("is-player-open");
  }
  function closePlayer() {
    if (!root.classList.contains("is-player-open") || root.classList.contains("is-player-closing")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.remove("is-player-open");
      return;
    }
    root.classList.add("is-player-closing");
    closingTimer = setTimeout(() => {
      root.classList.remove("is-player-open", "is-player-closing");
    }, 300);
  }

  const cache = new Map();
  const inflight = new Map();
  let queries = moodQueries[""];
  let activePage = 0;
  let activeMood = "";
  let signature = "";
  let currentTitle = "";
  let currentPageItems = [];
  let updateScheduled = false;
  let started = false;
  let lastLogged = "";
  const bootTitle = (app.getState() || {}).title;

  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function icon(symbol) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "zyx-ic");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#" + symbol);
    svg.appendChild(use);
    return svg;
  }

  function titleInitial(value) {
    const match = String(value || "Z").match(/[\p{L}\p{N}]/u);
    return match ? match[0].toUpperCase() : "Z";
  }

  function hueFor(value) {
    let n = 0;
    for (const ch of String(value || "")) n = (n * 31 + ch.codePointAt(0)) >>> 0;
    return 330 - (n % 75);
  }

  const COMPILATION = /\b(top\s*\d+|best\s+of|mix(tape)?|megamix|playlist|compilation|non[\s-]?stop|jukebox|full\s+album|\d+\s*(hours?|hrs?)|\d+\s*songs?|(hits|songs|music)\s+20\d\d|radio|24\/7|live\s+stream)\b/i;
  function visibleItems(data) {
    if (!data || !Array.isArray(data.items)) return [];
    const seen = new Set();
    return data.items.filter(item => {
      if (!item || typeof item.title !== "string" || !item.title.trim()) return false;
      if (!["youtube-embed", "direct-stream", "external-link"].includes(item.playbackType)) return false;
      if (COMPILATION.test(item.title)) return false;
      const key = item.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 9);
  }

  function playItem(item) {
    if (!item) return;
    if (typeof app.playOnline !== "function") {
      showState(activePage, "Player update required",
        "The online playback connection is not available yet.", true);
      return;
    }
    app.playOnline(item);
  }

  function trackCard(item, index) {
    const button = make("button", "zyx-home-track");
    button.type = "button";
    button.setAttribute("aria-label", "Play online track: " + item.title);
    button.dataset.onlineTitle = item.title;

    const cover = make("span", "zyx-home-cover");
    cover.style.setProperty("--tile-hue", String(hueFor(item.title)));

    const initial = make("span", "zyx-home-cover-initial", titleInitial(item.title));
    cover.appendChild(initial);

    if (typeof item.artworkUrl === "string" && /^https:\/\//i.test(item.artworkUrl)) {
      const img = document.createElement("img");
      img.className = "zyx-home-cover-img";
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("load", () => cover.classList.add("has-art"), { once: true });
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = item.artworkUrl;
      cover.appendChild(img);
    }

    cover.appendChild(make("span", "zyx-home-cover-index", String(index + 1).padStart(2, "0")));
    button.appendChild(cover);
    button.appendChild(make("span", "zyx-home-track-title", item.title));
    button.appendChild(make("span", "zyx-home-track-artist",
      [item.artist, item.providerAttribution || item.provider || "YouTube"].filter(Boolean).join(" · ")));
    button._zyxItem = item;
    button.addEventListener("click", () => playItem(item));
    return button;
  }

  function showState(pageIndex, heading, detail, retry) {
    const page = pages.children[pageIndex];
    if (!page) return;
    page.replaceChildren();
    if (heading === "Finding your sound") {
      for (let k = 0; k < 9; k++) {
        const sk = make("span", "zyx-home-track zyx-skel");
        sk.setAttribute("aria-hidden", "true");
        sk.appendChild(make("span", "zyx-home-cover"));
        sk.appendChild(make("span", "zyx-skel-line"));
        sk.appendChild(make("span", "zyx-skel-line zyx-skel-line--s"));
        page.appendChild(sk);
      }
      return;
    }
    const box = make("div", "zyx-home-state");
    box.appendChild(make("strong", "", heading));
    box.appendChild(make("p", "", detail));

    if (retry) {
      const btn = make("button", "zyx-btn zyx-btn--accent", "Try again");
      btn.type = "button";
      btn.addEventListener("click", () => loadPage(pageIndex, true));
      box.appendChild(btn);
    }
    page.appendChild(box);
  }

  function renderPage(pageIndex, items) {
    const page = pages.children[pageIndex];
    if (!page) return;
    page.replaceChildren();

    if (!items.length) {
      showState(pageIndex, "No online tracks found",
        "Try another mood or refresh the recommendations.", true);
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => fragment.appendChild(trackCard(item, index)));
    page.appendChild(fragment);

    if (pageIndex === activePage) {
      currentPageItems = items;
      highlightCurrentTrack();
    }
  }

  async function loadPage(pageIndex, force, shuffleAfterLoad) {
    const query = queries[pageIndex];
    const page = pages.children[pageIndex];
    if (!query || !page) return;

    if (!force && !cache.has(query)) {
      const hit = readCached(query);
      if (hit) cache.set(query, hit);
    }
    if (!force && cache.has(query)) {
      const cached = cache.get(query);
      renderPage(pageIndex, cached);
      if (shuffleAfterLoad && cached.length) playItem(cached[Math.floor(Math.random() * cached.length)]);
      return;
    }

    const previous = inflight.get(query);
    if (previous) previous.abort();

    const controller = new AbortController();
    inflight.set(query, controller);
    showState(pageIndex, "Finding your sound", "Searching real online music results…", false);

    try {
      const response = await fetch(
        "/api/music/search?q=" + encodeURIComponent(query) + "&provider=mainstream",
        { signal: controller.signal, cache: "no-store", headers: { Accept: "application/json" } }
      );
      let data;
      try { data = await response.json(); }
      catch (_) { data = null; }

      if (inflight.get(query) !== controller) return;

      if (!response.ok) {
        const provider = data && Array.isArray(data.providers) ? data.providers.find(p => p.message) : null;
        let heading = "Online music unavailable";
        let detail = provider && provider.message ? provider.message :
          "The online service returned HTTP " + response.status + ". Your local library remains available separately.";
        if (response.status === 429) heading = "Search limit reached";
        if (response.status === 503) heading = "Online source not configured";
        if (response.status >= 500 && response.status !== 503) heading = "Online source temporarily unavailable";
        showState(pageIndex, heading, detail, true);
        return;
      }

      const items = visibleItems(data);
      if (!items.length) {
        showState(pageIndex, "No playable results",
          "This search returned no items with a supported playback type.", true);
        return;
      }

      cache.set(query, items);
      writeCached(query, items);
      renderPage(pageIndex, items);
      if (shuffleAfterLoad) playItem(items[Math.floor(Math.random() * items.length)]);
    } catch (error) {
      if (error && error.name === "AbortError") return;
      showState(pageIndex, "Could not reach online music",
        "Check the connection and try again. No local songs will be substituted.", true);
    } finally {
      if (inflight.get(query) === controller) inflight.delete(query);
    }
  }

  let loadTimer = 0;
  function scheduleLoad() {
    clearTimeout(loadTimer);
    const p = activePage;
    loadTimer = setTimeout(() => { if (p === activePage) loadPage(p); }, 220);
  }

  function syncPage() {
    const width = pager.clientWidth || 1;
    activePage = Math.max(0, Math.min(queries.length - 1,
      Math.round(pager.scrollLeft / width)));
    count.textContent = String(activePage + 1).padStart(2, "0") + " / " +
      String(queries.length).padStart(2, "0");
    Array.from(dots.children).forEach((dot, i) =>
      dot.classList.toggle("is-active", i === activePage));
    const previous = $("zyx-home-page-prev");
    const next = $("zyx-home-page-next");
    if (previous) previous.disabled = activePage === 0;
    if (next) next.disabled = activePage >= queries.length - 1;
    currentPageItems = cache.get(queries[activePage]) || [];
    scheduleLoad();
    highlightCurrentTrack();
  }

  function buildPages() {
    for (const controller of inflight.values()) controller.abort();
    inflight.clear();
    pages.replaceChildren();
    dots.replaceChildren();
    queries.forEach((query, index) => {
      const page = make("div", "zyx-home-page");
      page.setAttribute("role", "group");
      page.setAttribute("aria-label", "Online recommendations, page " + (index + 1));
      page.dataset.query = query;
      pages.appendChild(page);
      const dot = make("span", "zyx-home-dot");
      dot.setAttribute("aria-hidden", "true");
      dots.appendChild(dot);
    });
    activePage = 0;
    pager.scrollLeft = 0;
    currentPageItems = [];
    syncPage();
  }

  function changeMood(query) {
    activeMood = query;
    queries = moodQueries[query] || [
      query, query + " mix", query + " playlist",
      query + " beats", query + " gaming music", "best " + query
    ];
    const unique = Array.from(new Set(queries.filter(Boolean)));
    queries = unique.length ? unique : moodQueries[""];
    root.querySelectorAll("[data-home-query]").forEach(button => {
      const active = button.dataset.homeQuery === query;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      if (active) { try { button.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); } catch (_) {} }
    });
    buildPages();
  }

  function highlightCurrentTrack() {
    const state = app.getState();
    const title = state && state.title ? state.title : "";
    root.querySelectorAll(".zyx-home-track").forEach(card => {
      const isCur = !!title && card.dataset.onlineTitle === title;
      card.classList.toggle("is-current", isCur);
      const coverEl = card.querySelector(".zyx-home-cover");
      const eqEl = coverEl && coverEl.querySelector(".zyx-eq");
      if (isCur && coverEl && !eqEl) {
        const bars = make("span", "zyx-eq");
        bars.setAttribute("aria-hidden", "true");
        bars.appendChild(make("i"));
        bars.appendChild(make("i"));
        bars.appendChild(make("i"));
        coverEl.appendChild(bars);
      } else if (!isCur && eqEl) {
        eqEl.remove();
      }
    });
  }

  function renderMiniCover(state) {
    miniCover.replaceChildren();
    const hue = hueFor(state.title);
    miniCover.style.background =
      "radial-gradient(circle at 25% 20%,hsla(" + hue + ",85%,75%,.45),transparent 50%)," +
      "linear-gradient(145deg,hsl(" + hue + ",48%,31%),hsl(" + (hue + 18) + ",33%,12%))";
    miniCover.appendChild(make("span", "", titleInitial(state.title)));

    if (typeof state.artUrl === "string" && /^https:\/\//i.test(state.artUrl)) {
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = state.artUrl;
      miniCover.appendChild(img);
    }
  }

  function updateMini() {
    updateScheduled = false;
    const state = app.getState();
    if (!state) return;

    if (!started && (state.playing || (state.kind && state.title !== bootTitle))) started = true;
    if (state.kind === "embed" && state.playing && state.title && state.title !== lastLogged) {
      lastLogged = state.title;
      rememberArtist(state.artist);
    }
    root.classList.toggle("has-track", started);
    const isEmpty = !state.kind || !started;
    const title = isEmpty ? "Discover music online" : (state.title || "Choose a song");
    const artist = isEmpty ? "Play a track from Quick Picks" :
      (state.artist || state.source || "Zynoxify Music");
    const sig = [title, artist, state.playing, state.kind, state.artUrl].join("|");

    if (sig !== signature) {
      miniTitle.textContent = title;
      miniArtist.textContent = artist;
      renderMiniCover({ title: title, artUrl: state.artUrl });
      const glowHue = hueFor(title);
      root.style.setProperty("--zx-glow-hue", String(glowHue));
      root.style.setProperty("--zx-glow-hue2", String((glowHue + 120) % 360));
      miniPlayIcon.setAttribute("href", state.playing ? "#zi-pause" : "#zi-play");
      miniPlay.setAttribute("aria-label", state.playing ? "Pause current track" : "Play current track");
      signature = sig;
    }
    highlightCurrentTrack();
  }

  function scheduleUpdate() {
    if (updateScheduled) return;
    updateScheduled = true;
    requestAnimationFrame(updateMini);
  }

  pager.addEventListener("scroll", () => requestAnimationFrame(syncPage), { passive: true });
  window.addEventListener("resize", () => requestAnimationFrame(syncPage), { passive: true });

  const prev = $("zyx-home-page-prev");
  const next = $("zyx-home-page-next");
  if (prev) prev.addEventListener("click", () =>
    pager.scrollBy({ left: -pager.clientWidth, behavior: "smooth" }));
  if (next) next.addEventListener("click", () =>
    pager.scrollBy({ left: pager.clientWidth, behavior: "smooth" }));

  root.querySelectorAll("[data-home-query]").forEach(button => {
    button.addEventListener("click", () => changeMood(button.dataset.homeQuery || ""));
  });

  const shuffleButton = $("zyx-home-shuffle");
  if (shuffleButton) {
    shuffleButton.setAttribute("aria-label", "Shuffle play online recommendations");
    shuffleButton.addEventListener("click", () => {
      const list = cache.get(queries[activePage]);
      if (list && list.length) playItem(list[Math.floor(Math.random() * list.length)]);
      else loadPage(activePage, true, true);
    });
  }

  const libraryButton = $("zyx-home-gaming");
  const favouritesButton = $("zyx-home-favourites");
  const discoverButton = $("zyx-home-discover");
  if (libraryButton) libraryButton.addEventListener("click", () => app.openLibrary(false));
  if (favouritesButton) favouritesButton.addEventListener("click", () => app.openLibrary(true));
  if (discoverButton) discoverButton.addEventListener("click", () => app.openSearch(""));

  miniOpen.addEventListener("click", () => openPlayer());
  miniPlay.addEventListener("click", () => {
    const state = app.getState();
    if (state && state.kind) app.togglePlay();
    else closePlayer();
  });
  miniNext.addEventListener("click", () => app.next());

  const back = $("zyx-player-back");
  if (back) back.addEventListener("click", () => closePlayer());
  const queue = $("zyx-player-queue");
  if (queue) queue.addEventListener("click", () => app.openQueue());

  const homeButton = $("zyx-home-btn");
  if (homeButton) homeButton.addEventListener("click", () => {
    closePlayer();
    if (typeof app.closeSheet === "function") app.closeSheet();
    home.scrollTo({ top: 0, behavior: "smooth" });
  });

  let miniTouchY = null;
  mini.addEventListener("touchstart", e => {
    if (e.touches.length === 1) miniTouchY = e.touches[0].clientY;
  }, { passive: true });
  mini.addEventListener("touchend", e => {
    if (miniTouchY === null || !e.changedTouches.length) return;
    const delta = e.changedTouches[0].clientY - miniTouchY;
    miniTouchY = null;
    if (delta < -50) openPlayer();
  }, { passive: true });

  const playerView = $("zyx-player-view");
  if (playerView) {
    let touchY = null;
    playerView.addEventListener("touchstart", e => {
      if (e.touches.length === 1) touchY = e.touches[0].clientY;
    }, { passive: true });
    playerView.addEventListener("touchend", e => {
      if (touchY === null || !e.changedTouches.length) return;
      const delta = e.changedTouches[0].clientY - touchY;
      touchY = null;
      if (delta > 75) closePlayer();
      else if (delta < -65 && !e.target.closest("button,input,a")) app.openQueue();
    }, { passive: true });
  }

  const observer = new MutationObserver(scheduleUpdate);
  observer.observe(root, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ["class", "aria-label", "aria-pressed", "href", "hidden"]
  });

  buildPages();
  const suggestList = $("zyx-suggest-list");
  const suggestBox = $("zyx-suggest");
  const searchField = $("zyx-q");
  if (suggestList && suggestBox && searchField) {
    [
      "Trending in India", "Top Hindi songs", "Punjabi hits", "Bollywood party",
      "Arijit Singh", "Diljit Dosanjh", "AP Dhillon", "Honey Singh",
      "Global top hits", "The Weeknd", "Taylor Swift", "Imagine Dragons"
    ].forEach(text => {
      const chip = make("button", "zyx-suggest-chip");
      chip.type = "button";
      chip.appendChild(icon("zi-search"));
      chip.appendChild(make("span", "", text));
      chip.addEventListener("click", () => app.openSearch(text));
      suggestList.appendChild(chip);
    });
    const syncSuggest = () => { suggestBox.hidden = searchField.value.trim().length > 0; };
    searchField.addEventListener("input", syncSuggest);
    syncSuggest();
  }

  const prog = make("span", "zyx-mini-prog");
  prog.setAttribute("aria-hidden", "true");
  mini.appendChild(prog);
  setInterval(() => {
    if (document.hidden) return;
    const st = app.getState();
    const pct = st && st.duration > 0 ? Math.min(100, (st.currentTime / st.duration) * 100) : 0;
    prog.style.width = pct.toFixed(1) + "%";
  }, 1000);

  root.addEventListener("click", e => {
    if (e.target.closest("button") && navigator.vibrate) {
      try { navigator.vibrate(6); } catch (_) {}
    }
  }, { passive: true });

  const greetEl = $("zyx-greet");
  if (greetEl) {
    const hr = new Date().getHours();
    greetEl.textContent = hr < 5 ? "Late night vibes" : hr < 12 ? "Good morning" :
      hr < 17 ? "Good afternoon" : hr < 22 ? "Good evening" : "Late night vibes";
  }

  root.addEventListener("pointerdown", e => {
    const target = e.target.closest(".zyx-mood, .zyx-navbtn, .zyx-suggest-chip, .zyx-key--play");
    if (!target || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = target.getBoundingClientRect();
    const size = Math.max(box.width, box.height) * 2;
    const ripple = make("span", "zyx-ripple");
    ripple.style.cssText = "width:" + size + "px;height:" + size + "px;left:" +
      (e.clientX - box.left - size / 2) + "px;top:" + (e.clientY - box.top - size / 2) + "px";
    target.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  }, { passive: true });

  const splash = $("zyx-splash");
  if (splash) {
    let seen = false;
    try { seen = !!sessionStorage.getItem("zynoxify:splash"); sessionStorage.setItem("zynoxify:splash", "1"); } catch (_) {}
    if (seen) {
      splash.remove();
      root.classList.add("no-splash");
    } else {
      const kill = () => { if (splash.parentNode) splash.remove(); };
      splash.addEventListener("click", kill);
      setTimeout(kill, 2700);
    }
  }

  const toast = make("div", "zyx-toast");
  toast.setAttribute("aria-hidden", "true");
  root.appendChild(toast);
  let toastTimer = 0;
  const liveEl = $("zyx-live");
  if (liveEl) {
    new MutationObserver(() => {
      const text = (liveEl.textContent || "").trim();
      if (!text || /^(Now playing|Loading)/i.test(text)) return;
      toast.textContent = text;
      toast.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("is-on"), 2200);
    }).observe(liveEl, { childList: true, characterData: true, subtree: true });
  }

  const capsData = [
    { q: "gaming music", t: "Gaming", s: "Level up", i: "zi-gamepad", h: 265 },
    { q: "phonk music", t: "Phonk", s: "Hard drift", i: "zi-flame", h: 350 },
    { q: "focus music", t: "Focus", s: "Deep work", i: "zi-headphones", h: 210 },
    { q: "chill music", t: "Chill", s: "Slow down", i: "zi-wave", h: 180 },
    { q: "workout music", t: "Workout", s: "Push harder", i: "zi-dumbbell", h: 22 },
    { q: "romantic songs", t: "Romance", s: "Hearts only", i: "zi-heart", h: 330 },
    { q: "night drive music", t: "Night drive", s: "After dark", i: "zi-moon", h: 238 },
    { q: "energy music", t: "Energize", s: "Max energy", i: "zi-bolt", h: 45 }
  ];
  const capsEl = $("zyx-caps");
  if (capsEl) {
    capsData.forEach(c => {
      const b = make("button", "zyx-cap");
      b.type = "button";
      b.style.setProperty("--h", String(c.h));
      b.style.setProperty("--h2", String((c.h + 28) % 360));
      b.setAttribute("aria-label", c.t + " mood");
      b.appendChild(icon(c.i));
      const copy = make("span", "zyx-cap-copy");
      copy.appendChild(make("strong", "", c.t));
      copy.appendChild(make("small", "", c.s));
      b.appendChild(copy);
      b.addEventListener("click", () => {
        changeMood(c.q);
        home.scrollTo({ top: 0, behavior: "smooth" });
      });
      capsEl.appendChild(b);
    });
  }

  const statusEl = $("zyx-status-text");
  if (statusEl) {
    const shorten = () => {
      const t = statusEl.textContent || "";
      const map = [[/online sources ready/i, "Online"], [/local collection only/i, "Local only"], [/status unknown/i, "Offline?"], [/checking/i, "Checking"]];
      for (const pair of map) {
        if (pair[0].test(t) && t !== pair[1]) {
          statusEl.textContent = pair[1];
          if (statusEl.parentNode) statusEl.parentNode.title = t;
          return;
        }
      }
    };
    new MutationObserver(shorten).observe(statusEl, { childList: true, characterData: true, subtree: true });
    shorten();
  }

  const fsBtn = $("zyx-fs");
  if (fsBtn) {
    const docEl = document.documentElement;
    const reqFs = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
    const exitFs = document.exitFullscreen || document.webkitExitFullscreen;
    const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
    if (!reqFs) fsBtn.hidden = true;
    const syncFs = () => {
      const on = isFs();
      fsBtn.setAttribute("aria-pressed", String(on));
      fsBtn.setAttribute("aria-label", on ? "Exit full screen" : "Enter full screen");
      const u = fsBtn.querySelector("use");
      if (u) u.setAttribute("href", on ? "#zi-shrink" : "#zi-expand");
    };
    fsBtn.addEventListener("click", () => {
      try {
        if (isFs()) exitFs.call(document);
        else reqFs.call(docEl);
      } catch (_) {}
    });
    document.addEventListener("fullscreenchange", syncFs);
    document.addEventListener("webkitfullscreenchange", syncFs);
    syncFs();
  }

  updateMini();
})();
