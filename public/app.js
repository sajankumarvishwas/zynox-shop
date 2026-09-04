const productContainer = document.getElementById("products");

const fallbackProducts = [
  {
    id: "vip",
    name: "VIP",
    price: 49,
    perks: {
      homes: 3,
      title: "VIP",
      particles: 1,
      join_effect: true,
      kill_effect: false
    }
  },
  {
    id: "mvp",
    name: "MVP",
    price: 99,
    perks: {
      homes: 5,
      title: "MVP",
      particles: 2,
      join_effect: true,
      kill_effect: false
    }
  },
  {
    id: "elite",
    name: "ELITE",
    price: 199,
    perks: {
      homes: 8,
      title: "ELITE",
      particles: 4,
      join_effect: true,
      kill_effect: true
    }
  }
];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getRankIcon(id) {
  if (id === "vip") return "✦";
  if (id === "mvp") return "◆";
  if (id === "elite") return "♛";
  return "✦";
}

function getRankDescription(id) {
  if (id === "vip") {
    return "Your first step into the ZynoxSMP supporter club.";
  }

  if (id === "mvp") {
    return "More convenience, more style and more ways to stand out.";
  }

  if (id === "elite") {
    return "The ultimate ZynoxSMP supporter experience.";
  }

  return "A ZynoxSMP supporter package.";
}

function makePerks(product) {
  const perks = [];
  const data = product.perks || {};

  if (data.homes) {
    perks.push(`${data.homes} extra homes`);
  }

  if (data.title) {
    perks.push(`${data.title} exclusive title`);
  }

  if (data.particles) {
    perks.push(`${data.particles} cosmetic particle option${data.particles > 1 ? "s" : ""}`);
  }

  if (data.join_effect) {
    perks.push("Join effect");
  }

  if (data.kill_effect) {
    perks.push("Exclusive kill effect");
  }

  return perks;
}

function renderProducts(products) {
  productContainer.innerHTML = "";

  products.forEach((product, index) => {
    const id = String(product.id).toLowerCase();
    const name = escapeHtml(product.name);
    const price = Number(product.price) || 0;
    const perks = makePerks(product);

    const card = document.createElement("article");
    card.className = `rank-card ${id === "mvp" ? "featured" : ""}`;

    card.innerHTML = `
      <div class="rank-glow"></div>

      <div class="rank-top">
        <div class="rank-icon">${getRankIcon(id)}</div>
        ${id === "mvp" ? '<span class="rank-label">MOST POPULAR</span>' : ""}
      </div>

      <h3>${name}</h3>

      <div class="rank-price">
        <strong>₹${price}</strong>
        <span>one-time</span>
      </div>

      <p class="rank-description">
        ${escapeHtml(getRankDescription(id))}
      </p>

      <div class="perks">
        ${
          perks.length
            ? perks.map(perk => `<div class="perk">${escapeHtml(perk)}</div>`).join("")
            : `<div class="perk">ZynoxSMP supporter rank</div>`
        }
      </div>

      <button
        class="buy-button"
        data-product="${escapeHtml(product.name)}"
        data-price="${price}">
        Get ${name} →
      </button>
    `;

    productContainer.appendChild(card);
  });

  document.querySelectorAll(".buy-button").forEach(button => {
    button.addEventListener("click", () => {
      const product = button.dataset.product;
      const price = button.dataset.price;

      window.location.href =
        `/checkout.html?product=${encodeURIComponent(product)}&price=${encodeURIComponent(price)}`;
    });
  });
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products", {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Products endpoint unavailable");
    }

    const data = await response.json();

    if (!data.success || !Array.isArray(data.products)) {
      throw new Error("Invalid products response");
    }

    renderProducts(data.products);
  } catch (error) {
    console.warn("[Zynox Shop] Using fallback products:", error);
    renderProducts(fallbackProducts);
  }
}

function scrollToRanks() {
  document.getElementById("ranks")?.scrollIntoView({
    behavior: "smooth"
  });
}

window.scrollToRanks = scrollToRanks;

loadProducts();

document.querySelectorAll(".mc-server-copy").forEach(button => {
  button.addEventListener("click", async () => {
    const address = button.dataset.copy;

    try {
      await navigator.clipboard.writeText(address);
      const original = button.textContent;
      button.textContent = "COPIED ✓";

      setTimeout(() => {
        button.textContent = original;
      }, 1600);
    } catch (error) {
      console.warn("[Zynox Hub] Clipboard unavailable:", error);
    }
  });
});

document.querySelectorAll(".mc-server-card[data-server]").forEach(card => {
  const openServer = () => {
    document.body.classList.add("zynox-page-leaving");

    setTimeout(() => {
      window.location.href =
        `/server.html?server=${encodeURIComponent(card.dataset.server)}`;
    }, 280);
  };

  card.addEventListener("click", event => {
    if (event.target.closest(".mc-server-copy")) return;
    openServer();
  });

  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openServer();
    }
  });
});
