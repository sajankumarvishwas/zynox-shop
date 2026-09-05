const productContainer = document.getElementById("products");

const fallbackProducts = [
  {
    id: "pizza",
    name: "Fanta Ki Chhoti Bottle",
    price: 29,
    icon: "🥤"
  },
  {
    id: "fanta",
    name: "Fanta Ki Badi Bottle",
    price: 49,
    icon: "🧃"
  },
  {
    id: "ration",
    name: "Chai-Nashta",
    price: 79,
    icon: "☕"
  },
  {
    id: "server",
    name: "Zynox Recharge Fund",
    price: 349,
    icon: "📱"
  }
];


/* ---------- Zynox UI SFX ---------- */

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
  click: new Audio("/assets/audio/zynox/click_001.ogg"),
  select: new Audio("/assets/audio/zynox/select_001.ogg"),
  confirm: new Audio("/assets/audio/zynox/confirmation_001.ogg"),
  open: new Audio("/assets/audio/zynox/open_001.ogg"),
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
    return "A little boost for the Zynox journey. 🚀";
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
        <span class="rank-label">ZYNOX GOODIES</span>
      </div>

      <h3>${name}</h3>

      <div class="rank-price">
        <strong>₹${price}</strong>
        <span>good vibes</span>
      </div>

      <p class="rank-description">
        ${escapeHtml(getDonationDescription(id))}
      </p>

      <div class="perks">
        <div class="perk">◆ Good vibes delivered 😎</div>
        ${id === "pizza" ? `
          <div class="perk">🥤 Admin ki Fanta incoming 😎</div>
        ` : id === "fanta" ? `
          <div class="perk">🥤 Badi bottle, badi khushi 😂</div>
          <div class="perk">◆ Admin approved ✅</div>
        ` : id === "ration" ? `
          <div class="perk">☕ Chai-Nashta unlocked</div>
          <div class="perk">😎 Admin ka mood set</div>
          <div class="perk">◆ Zynox ko thoda extra pyaar</div>
        ` : id === "server" ? `
          <div class="perk">📱 Recharge fund me gaya</div>
          <div class="perk">😂 Net chalu = Zynox chalu</div>
          <div class="perk">🎮 Game on, boss</div>
          <div class="perk">◆ Admin officially thankful</div>
          <div class="perk">💋 Zynox ki taraf se gili pappi 😘</div>
        ` : `
          <div class="perk">😎 Bas chill, tumne apna kaam kar diya</div>
        `}
      </div>

      <button
        class="buy-button donation-button"
        data-product="${name}"
        data-price="${price}">
        SEND ₹${price} →
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

    <h3>Custom Treat</h3>

    <div class="rank-price">
      <strong>₹?</strong>
      <span>any amount</span>
    </div>

    <p class="rank-description">
      Pick your own amount and send some good vibes to Zynox. 😎
    </p>

    <div class="perks">
      <div class="perk">❤ Jitna mann kare, utna hi</div>
      <div class="perk">◆ Apna message bhi chhod sakte ho</div>
      <div class="perk">😎 Baaki vibe Admin sambhal lega</div>
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
      playZynoxSfx("click");

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
      playZynoxSfx("confirm");
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
    playZynoxSfx("open");
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
