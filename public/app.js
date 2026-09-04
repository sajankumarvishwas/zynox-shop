const productContainer = document.getElementById("products");

const fallbackProducts = [
  {
    id: "pizza",
    name: "Treat Admin a Pizza",
    price: 49,
    icon: "🍕"
  },
  {
    id: "fanta",
    name: "Treat Admin a Fanta",
    price: 29,
    icon: "🥤"
  },
  {
    id: "ration",
    name: "Admin ka Ration",
    price: 79,
    icon: "🍱"
  },
  {
    id: "server",
    name: "Support the Server",
    price: 99,
    icon: "⛏"
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

function getDonationIcon(product) {
  if (product.id === "pizza") {
    return '<img src="/assets/minecraft/items/fanta-small.png" alt="Fanta Ki Bottle">';
  }

  if (product.id === "fanta") {
    return '<img src="/assets/minecraft/items/fanta-big.png" alt="Fanta Ki Badi Bottle">';
  }

  return product.icon || "❤";
}

function getDonationDescription(id) {
  if (id === "pizza") {
    return "Help keep the admin fed while Zynox keeps moving.";
  }

  if (id === "fanta") {
    return "A tiny refreshment for the person keeping the server alive.";
  }

  if (id === "ration") {
    return "Help stock up the admin's virtual-world survival supplies.";
  }

  if (id === "server") {
    return "Put your support directly toward the Zynox server.";
  }

  return "Every little bit helps keep Zynox running.";
}

function renderProducts(products) {
  productContainer.innerHTML = "";

  products.forEach(product => {
    const id = String(product.id).toLowerCase();
    const name = escapeHtml(product.name);
    const price = Number(product.price) || 0;

    const card = document.createElement("article");
    card.className = "rank-card donation-card";

    card.innerHTML = `
      <div class="rank-glow"></div>

      <div class="rank-top">
        <div class="rank-icon">${getDonationIcon(product)}</div>
        <span class="rank-label">SUPPORT</span>
      </div>

      <h3>${name}</h3>

      <div class="rank-price">
        <strong>₹${price}</strong>
        <span>donation</span>
      </div>

      <p class="rank-description">
        ${escapeHtml(getDonationDescription(id))}
      </p>

      <div class="perks">
        <div class="perk">❤ No rank required</div>
        <div class="perk">◆ Pure server support</div>
      </div>

      <button
        class="buy-button donation-button"
        data-product="${name}"
        data-price="${price}">
        DONATE ₹${price} →
      </button>
    `;

    productContainer.appendChild(card);
  });

  const customCard = document.createElement("article");
  customCard.className = "rank-card donation-card custom-donation-card";

  customCard.innerHTML = `
    <div class="rank-glow"></div>

    <div class="rank-top">
      <div class="rank-icon">💚</div>
      <span class="rank-label">YOUR CHOICE</span>
    </div>

    <h3>Custom Donation</h3>

    <div class="rank-price">
      <strong>₹?</strong>
      <span>any amount</span>
    </div>

    <p class="rank-description">
      Choose exactly how much you want to contribute to Zynox.
    </p>

    <div class="perks">
      <div class="perk">❤ You choose the amount</div>
      <div class="perk">◆ Optional message to Admin</div>
    </div>

    <button
      class="buy-button donation-button custom-donation-button"
      data-product="Custom Donation"
      data-price="custom">
      CHOOSE AMOUNT →
    </button>
  `;

  productContainer.appendChild(customCard);

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

const zynoxRevealItems = document.querySelectorAll(
  ".mc-section, .minecraft-announcement, .minecraft-feature-strip, .minecraft-footer-cta"
);

const zynoxRevealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("zynox-revealed");
        zynoxRevealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -40px 0px"
  }
);

zynoxRevealItems.forEach(item => {
  zynoxRevealObserver.observe(item);
});


/* =========================================================
   RANDOM MINECRAFT DECORATIONS
   Changes decorative card assets on every page load.
========================================================= */

(() => {
  const randomDecorations = [
    "/assets/decor/flower-poppy.svg",
    "/assets/decor/flower-dandelion.svg",
    "/assets/decor/flower-blue.svg",
    "/assets/minecraft/items/wheat.png",
    "/assets/minecraft/items/apple.png",
    "/assets/minecraft/items/ore_emerald.png",
    "/assets/minecraft/items/ore_diamond.png",
    "/assets/minecraft/items/ore_gold.png"
  ];

  const shuffle = items => {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  };

  const decorativeTargets = document.querySelectorAll(
    ".minecraft-category-card::after"
  );

  const cards = [
    ...document.querySelectorAll(".minecraft-category-card"),
    ...document.querySelectorAll(".rank-card"),
    ...document.querySelectorAll(".creation-vault")
  ];

  if (!cards.length) return;

  const pool = shuffle(randomDecorations);

  cards.forEach((card, index) => {
    const asset = pool[index % pool.length];
    card.style.setProperty(
      "--zynox-random-decor",
      `url("${asset}")`
    );
  });
})();
