/* ZYNOXIFY MUSIC - track options menu (play next, add to queue, like), long-press and "more" buttons */
(function () {
  "use strict";
  const root = document.getElementById("zyx-root");
  const app = window.ZynoxifyMusic;
  if (!root || !app || typeof app.playNext !== "function") return;

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
  const extras = [];

  function describe(entry) {
    if (entry.kind === "local") {
      const s = songs[entry.idx] || {};
      return { title: s.title || "Local song", artist: s.artist || "", art: null, sub: "Local collection" };
    }
    const it = entry.item || {};
    return {
      title: it.title || "Online track", artist: it.artist || "",
      art: typeof it.artworkUrl === "string" && /^https:\/\//i.test(it.artworkUrl) ? it.artworkUrl : null,
      sub: it.providerAttribution || "YouTube"
    };
  }
  function queueable(entry) {
    if (entry.kind === "local") return Number.isInteger(entry.idx) && entry.idx >= 0 && entry.idx < songs.length;
    return !!(entry.item && typeof entry.item.embedUrl === "string" && EMBED.test(entry.item.embedUrl));
  }

  let menuEl = null;
  function closeMenu() {
    if (!menuEl) return;
    const el = menuEl;
    menuEl = null;
    el.classList.remove("is-open");
    setTimeout(() => el.remove(), 340);
  }
  function actionButton(label, sym, run) {
    const b = make("button", "zyx-tmenu-act");
    b.type = "button";
    b.appendChild(icon(sym));
    b.appendChild(make("span", "", label));
    b.addEventListener("click", () => { closeMenu(); run(); });
    return b;
  }
  function openMenu(entry) {
    if (!entry || menuEl) return;
    const d = describe(entry);
    const wrap = make("div", "zyx-tmenu");
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", "Options for " + d.title);
    const scrim = make("div", "zyx-tmenu-scrim");
    scrim.addEventListener("click", closeMenu);
    const card = make("div", "zyx-tmenu-card");
    card.appendChild(make("span", "zyx-tmenu-grab"));

    const head = make("div", "zyx-tmenu-head");
    const cover = make("span", "zyx-tmenu-cover");
    cover.appendChild(make("span", "", (Array.from(d.title).find((c) => /[\p{L}\p{N}]/u.test(c)) || "Z").toUpperCase()));
    if (d.art) {
      const img = document.createElement("img");
      img.alt = ""; img.referrerPolicy = "no-referrer"; img.loading = "lazy";
      img.addEventListener("error", () => img.remove(), { once: true });
      img.src = d.art;
      cover.appendChild(img);
    }
    head.appendChild(cover);
    const copy = make("span", "zyx-tmenu-copy");
    copy.appendChild(make("strong", "", d.title));
    copy.appendChild(make("small", "", [d.artist, d.sub].filter(Boolean).join(" \u00b7 ")));
    head.appendChild(copy);
    card.appendChild(head);

    const list = make("div", "zyx-tmenu-list");
    if (queueable(entry)) {
      list.appendChild(actionButton("Play next", "zi-next", () => app.playNext(entry)));
      list.appendChild(actionButton("Add to queue", "zi-queue", () => app.addToQueue(entry)));
    }
    if (entry.kind === "online" && queueable(entry)) {
      const hooks = window.ZynoxifyHooks || {};
      if (typeof hooks.toggleLike === "function") {
        const on = typeof hooks.isLiked === "function" && hooks.isLiked(entry.item);
        list.appendChild(actionButton(on ? "Remove from liked songs" : "Like song", "zi-heart", () => hooks.toggleLike(entry.item)));
      }
    } else if (entry.kind === "local") {
      const on = app.isFav(entry.idx);
      list.appendChild(actionButton(on ? "Remove from favourites" : "Save to favourites (this device)", "zi-heart", () => {
        say(app.toggleFav(entry.idx) ? "Saved to favourites on this device" : "Removed from favourites");
      }));
    }
    extras.forEach((fn) => {
      let a = null;
      try { a = fn(entry); } catch (_) {}
      if (a && a.label && typeof a.run === "function") list.appendChild(actionButton(a.label, a.icon || "zi-list", a.run));
    });
    if (entry.kind === "online" && entry.item) {
      const m = typeof entry.item.embedUrl === "string" && entry.item.embedUrl.match(EMBED);
      const href = m ? "https://www.youtube.com/watch?v=" + m[1]
        : (typeof entry.item.externalUrl === "string" && /^https:\/\//i.test(entry.item.externalUrl) ? entry.item.externalUrl : "");
      if (href) list.appendChild(actionButton("Open on " + (m ? "YouTube" : (entry.item.providerAttribution || "provider")), "zi-external",
        () => window.open(href, "_blank", "noopener,noreferrer")));
    }
    card.appendChild(list);
    wrap.appendChild(scrim);
    wrap.appendChild(card);
    root.appendChild(wrap);
    menuEl = wrap;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      wrap.classList.add("is-open");
      const first = list.querySelector("button");
      if (first) first.focus({ preventScroll: true });
    }));
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- which track is under the finger / pointer ---------- */
  function entryFromTarget(t) {
    if (!t || !t.closest) return null;
    const card = t.closest(".zyx-home-track");
    if (card && card._zyxItem) return { kind: "online", item: card._zyxItem };
    const row = t.closest("#zyx-list .zyx-row[data-i]");
    if (row) return { kind: "local", idx: Number(row.dataset.i) };
    const res = t.closest(".zyx-result");
    if (res) {
      const b = res.querySelector("[data-act='embed'][data-idx]");
      const it = b ? app.getSearchItems()[Number(b.dataset.idx)] : null;
      if (it) return { kind: "online", item: it };
    }
    return null;
  }

  /* long press (touch) and right click (mouse) */
  let timer = 0, startX = 0, startY = 0, swallow = 0;
  const cancel = () => { clearTimeout(timer); timer = 0; };
  root.addEventListener("touchstart", (e) => {
    cancel();
    if (e.touches.length !== 1) return;
    const entry = entryFromTarget(e.target);
    if (!entry) return;
    startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    timer = setTimeout(() => {
      timer = 0;
      swallow = Date.now() + 700;
      if (navigator.vibrate) { try { navigator.vibrate(12); } catch (_) {} }
      openMenu(entry);
    }, 520);
  }, { passive: true });
  root.addEventListener("touchmove", (e) => {
    if (!timer) return;
    const t = e.touches[0];
    if (Math.abs(t.clientX - startX) > 10 || Math.abs(t.clientY - startY) > 10) cancel();
  }, { passive: true });
  ["touchend", "touchcancel"].forEach((n) => root.addEventListener(n, cancel, { passive: true }));
  root.addEventListener("click", (e) => {
    if (Date.now() < swallow) { e.stopPropagation(); e.preventDefault(); swallow = 0; }
  }, true);
  root.addEventListener("contextmenu", (e) => {
    const entry = entryFromTarget(e.target);
    if (!entry) return;
    e.preventDefault();
    cancel();
    swallow = 0;
    openMenu(entry);
  });

  /* "More" button on search results */
  const results = $("zyx-results");
  if (results) {
    const decorate = () => {
      results.querySelectorAll(".zyx-result").forEach((card) => {
        if (card.querySelector(".zyx-more-btn")) return;
        const idxBtn = card.querySelector("[data-act='embed'][data-idx]");
        const actions = card.querySelector(".zyx-result-actions");
        if (!idxBtn || !actions) return;
        const b = make("button", "zyx-btn zyx-more-btn");
        b.type = "button";
        b.dataset.moreIdx = idxBtn.dataset.idx;
        b.setAttribute("aria-label", "More options");
        b.appendChild(icon("zi-more"));
        b.appendChild(make("span", "", "More"));
        actions.appendChild(b);
      });
    };
    new MutationObserver(decorate).observe(results, { childList: true, subtree: true });
    decorate();
    results.addEventListener("click", (e) => {
      const b = e.target.closest(".zyx-more-btn");
      if (!b) return;
      const it = app.getSearchItems()[Number(b.dataset.moreIdx)];
      if (it) openMenu({ kind: "online", item: it });
    });
  }

  /* "More" button in Now Playing */
  const more = $("zyx-more");
  if (more) more.addEventListener("click", () => {
    const entry = app.getCurrentEntry();
    if (entry) openMenu(entry); else say("Play a song first.");
  });

  window.ZynoxifyMenu = {
    open: openMenu,
    registerAction: (fn) => { if (typeof fn === "function") extras.push(fn); }
  };
})();
