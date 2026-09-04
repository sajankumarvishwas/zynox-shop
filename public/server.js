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
    .map(feature => `<span class="server-feature">◆ ${escapeHtml(feature)}</span>`)
    .join("");

  const memories = Array.isArray(server.memories) ? server.memories : [];

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
                    <span class="memory-video-badge">VIDEO</span>
                    <span class="memory-video-tap">TAP TO EXPAND</span>
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

      <a class="server-back" href="/#servers">← BACK TO SERVERS</a>

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

      <div class="server-feature-panel">
        ${features}
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

      <div class="server-memory-grid">
        ${memoryMarkup}
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
        <a href="/#ranks">Store</a>
        <a href="/#community">Community</a>
      </div>
    </footer>
  `;

  document.querySelectorAll(".server-copy-button").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
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
