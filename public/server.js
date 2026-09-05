/* ---------- Zynox Server Page SFX ---------- */

/* ---------- Zynox Global Meow SFX ---------- */

const zynoxMeow = new Audio("/assets/audio/zynox/meow.ogg");
zynoxMeow.preload = "auto";
zynoxMeow.volume = 0.16;

function playZynoxMeow() {
  try {
    zynoxMeow.currentTime = 0;
    const playback = zynoxMeow.play();
    if (playback?.catch) playback.catch(() => {});
  } catch (_) {}
}

document.addEventListener("click", event => {
  const target = event.target.closest("a, button, [role='button'], input, select, textarea");

  if (!target) {
    playZynoxMeow();
    return;
  }

  const hasDedicatedSfx =
    target.matches(
      ".buy-button, .mc-server-copy, .mc-server-card, " +
      ".server-play-button, .server-copy-button, .memory-video-wrap"
    );

  if (!hasDedicatedSfx) {
    playZynoxMeow();
  }
}, { passive: true });



const zynoxSfx = {
  open: new Audio("/assets/audio/zynox/open_001.ogg"),
  confirm: new Audio("/assets/audio/zynox/confirmation_001.ogg"),
  click: new Audio("/assets/audio/zynox/click_001.ogg"),
  select: new Audio("/assets/audio/zynox/select_001.ogg"),
  close: new Audio("/assets/audio/zynox/close_001.ogg")
};

Object.values(zynoxSfx).forEach(audio => {
  audio.preload = "auto";
  audio.volume = 0.32;
});

function playZynoxSfx(name) {
  const source = zynoxSfx[name];
  if (!source) return;

  try {
    source.currentTime = 0;
    const playback = source.play();
    if (playback?.catch) playback.catch(() => {});
  } catch (_) {}
}

const page = document.getElementById("serverPage");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getServerId() {
  return new URLSearchParams(window.location.search).get("server");
}

function minecraftJoinLink(ip, port) {
  return `minecraft://connect/${ip}:${port}`;
}

function renderServer(server) {
  document.title = `${server.name} • Zynox World`;

  const features = (server.features || [])
    .map(feature => {
      const parts = String(feature).split(" • ");
      return `<span class="server-feature">
        ${parts.map(part => escapeHtml(part)).join("<br>")}
      </span>`;
    })
    .join("");

  const memories = Array.isArray(server.memories)
    ? [...server.memories].sort(() => Math.random() - 0.5)
    : [];

  const memoryMarkup = memories.length
    ? memories.map((memory, index) => `
        <article class="server-memory-card ${index % 2 ? "memory-reverse" : "memory-forward"}">

          <div class="memory-media">
            ${
              memory.type === "video"
                ? `<div class="memory-video-wrap">
                    <video
                      src="${escapeHtml(memory.media)}"
                      poster="${escapeHtml(memory.poster || "")}"
                      playsinline
                      muted
                      autoplay
                      loop
                      preload="auto"
                      class="memory-video">
                    </video>
                  </div>`
                : `<img
                    src="${escapeHtml(memory.media)}"
                    alt="${escapeHtml(memory.title || "Zynox Memory")}"
                    loading="lazy">`
            }

            ${memory.featured ? '<span class="memory-featured-badge">FEATURED</span>' : ""}
          </div>

          <div class="server-memory-body">
            <h3>${escapeHtml(memory.title || "Zynox Memory")}</h3>
            <p>${escapeHtml(memory.caption || memory.description || "")}</p>

            ${
              (memory.players || []).length
                ? `<div class="memory-players">
                    ${memory.players.map(player => `<span>${escapeHtml(player)}</span>`).join("")}
                  </div>`
                : ""
            }
          </div>

        </article>
      `).join("")
    : `
      <div class="server-memory-empty">
        <div class="memory-empty-icon">+</div>
        <div>
          <span class="category-tag">MEMORIES ARCHIVE</span>
          <h3>NO MEMORIES ADDED YET</h3>
          <p>
            Screenshots, videos, player names and server moments for this world
            will appear here.
          </p>
        </div>
      </div>
    `;

  page.innerHTML = `
    <section class="server-hero-panel">

      <div class="server-hero-main">
        <div>
          <span class="server-badge">${escapeHtml(server.tag)}</span>
          <h1>${escapeHtml(server.name)}</h1>
          <p>${escapeHtml(server.description)}</p>
        </div>

        <div class="server-live-indicator">
          <span></span>
          SERVER
        </div>
      </div>

      <div class="server-action-row">
        <a
          class="mc-button mc-button-primary server-play-button"
          href="${minecraftJoinLink(server.ip, server.port)}">
          PLAY / JOIN SERVER
        </a>

        <button
          class="mc-button mc-button-secondary server-copy-button"
          type="button"
          data-copy="${escapeHtml(`${server.ip}:${server.port}`)}">
          COPY IP & PORT
        </button>
      </div>

      <div class="server-connection-panel">

        <div class="connection-box">
          <span>IP ADDRESS</span>
          <strong>${escapeHtml(server.ip)}</strong>
        </div>

        <div class="connection-box">
          <span>PORT</span>
          <strong>${escapeHtml(server.port)}</strong>
        </div>

        <div class="connection-box">
          <span>VERSION</span>
          <strong>${escapeHtml(server.version)}</strong>
        </div>

        <div class="connection-box">
          <span>TYPE</span>
          <strong>${escapeHtml(server.type)}</strong>
        </div>

      </div>
    </section>

    <section class="mc-section server-info-section">

      <div class="minecraft-section-title">
        <div class="title-line"></div>
        <div>
          <span class="section-kicker">WORLD INFORMATION</span>
          <h2>ABOUT THIS SERVER</h2>
        </div>
        <div class="title-line"></div>
      </div>

      <div class="server-feature-scene">

        <div class="server-scene-sky"></div>

        <img
          class="server-scene-clouds"
          src="/assets/server/world-pack/skybox_side.png"
          alt=""
          aria-hidden="true">

        <img
          class="server-scene-moon"
          src="/assets/server/world-pack/skybox_top.png"
          alt=""
          aria-hidden="true">

        <img
          class="server-scene-terrain"
          src="/assets/server/world-pack/skybox_bottom.png"
          alt=""
          aria-hidden="true">

        <div class="server-scene-landmark" aria-hidden="true">
          <div class="landmark-block landmark-block-a"></div>
          <div class="landmark-block landmark-block-b"></div>
          <div class="landmark-block landmark-block-c"></div>
          <div class="landmark-crystal"></div>
        </div>

        <div class="server-about-copy">
          ${(server.about || "")
            .split("\n")
            .map(line => line.trim()
              ? `<p>${escapeHtml(line)}</p>`
              : `<div class="about-gap"></div>`)
            .join("")}
        </div>

        <div class="server-feature-panel">
          ${features}
        </div>

      </div>

    </section>

    <section class="mc-section server-memories-section">

      <div class="minecraft-section-title">
        <div class="title-line"></div>
        <div>
          <span class="section-kicker">THE WORLD ARCHIVE</span>
          <h2>SERVER MEMORIES</h2>
        </div>
        <div class="title-line"></div>
      </div>

      <p class="section-description">
        Only memories belonging to ${escapeHtml(server.name)} are shown here.
      </p>

      <div class="server-memory-gallery">

        <span class="memory-side-asset memory-side-ore memory-side-left" aria-hidden="true">
          <img src="/assets/server/world-pack/ore_ruby.png" alt="">
        </span>

        <span class="memory-side-asset memory-side-pick memory-side-right" aria-hidden="true">
          <img src="/assets/server/world-pack/pick_iron.png" alt="">
        </span>

        <span class="memory-side-particle memory-particle-a" aria-hidden="true"></span>
        <span class="memory-side-particle memory-particle-b" aria-hidden="true"></span>
        <span class="memory-side-particle memory-particle-c" aria-hidden="true"></span>

        <div class="server-memory-grid">
          ${memoryMarkup}
        </div>

      </div>

    </section>

    <section class="minecraft-footer-cta">
      <div class="footer-cta-inner">
        <span class="section-kicker">READY TO ENTER?</span>
        <h2>PLAY <span>${escapeHtml(server.name)}</span></h2>
        <p>Jump back into the world and make the next memory.</p>

        <a
          class="mc-button mc-button-primary"
          href="${minecraftJoinLink(server.ip, server.port)}">
          ENTER WORLD
        </a>
      </div>
    </section>

    <footer class="mc-footer">
      <a href="/" class="footer-logo">
        <span class="mc-brand-block">ZY</span>
        <span>Zynox World</span>
      </a>

      <div class="footer-links">
        <a href="/#servers">Servers</a>
        <a href="/#creations">Creations</a>
        <a href="/#ranks">Support</a>
        <a href="/#community">Community</a>
      </div>
    </footer>
  `;

  document.querySelectorAll(".server-play-button").forEach(button => {
    button.addEventListener("click", () => {
      playZynoxSfx("open");
    });
  });

  document.querySelectorAll(".server-copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        playZynoxSfx("confirm");
        const original = button.textContent;
        button.textContent = "COPIED ✓";
        setTimeout(() => {
          button.textContent = original;
        }, 1600);
      } catch (error) {
        console.warn("[Zynox World] Clipboard unavailable:", error);
      }
    });
  });
}

async function loadServer() {
  const id = getServerId();

  if (!id) {
    page.innerHTML = `
      <section class="mc-section">
        <div class="server-memory-empty">
          <h2>SERVER NOT FOUND</h2>
          <p>Choose a server from the Zynox World homepage.</p>
          <a class="mc-button mc-button-primary" href="/#servers">BACK TO SERVERS</a>
        </div>
      </section>
    `;
    return;
  }

  try {
    const response = await fetch("/data/servers.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Server data unavailable");
    }

    const data = await response.json();
    const server = (data.servers || []).find(item => item.id === id);

    if (!server) {
      throw new Error("Server not found");
    }

    try {
      const memoryResponse = await fetch(
        `/data/${encodeURIComponent(id)}.json`,
        { cache: "no-store" }
      );

      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json();

        if (Array.isArray(memoryData.memories)) {
          server.memories = memoryData.memories.map(memory => ({
            ...memory,
            caption: memory.caption || memory.description || ""
          }));
        }
      }
    } catch (memoryError) {
      console.warn("[Zynox World] Memory data unavailable:", memoryError);
    }

    renderServer(server);
  } catch (error) {
    console.error("[Zynox World] Server page error:", error);

    page.innerHTML = `
      <section class="mc-section">
        <div class="server-memory-empty">
          <h2>WORLD DATA UNAVAILABLE</h2>
          <p>Please return to the Zynox World homepage.</p>
          <a class="mc-button mc-button-primary" href="/">BACK HOME</a>
        </div>
      </section>
    `;
  }
}

document.addEventListener("click", async event => {
  const wrap = event.target.closest(".memory-video-wrap");

  if (!wrap) return;

  const video = wrap.querySelector("video");

  if (!video) return;

  try {
    playZynoxSfx("click");
    video.muted = false;
    video.controls = true;

    if (video.requestFullscreen) {
      await video.requestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      video.webkitEnterFullscreen();
    }

    await video.play();
  } catch (error) {
    console.warn("[Zynox World] Fullscreen video failed:", error);

    try {
      video.muted = false;
      video.controls = true;
      await video.play();
    } catch (_) {}
  }
});

document.addEventListener("fullscreenchange", () => {
  document.querySelectorAll(".memory-video").forEach(video => {
    if (!document.fullscreenElement) {
      video.muted = true;
      video.controls = false;
    }
  });
});

loadServer();
