const productContainer = document.getElementById("products");

const fallbackProducts = [
  { id: "pizza", name: "Fanta Ki Chhoti Bottle", price: 29, icon: "🥤" },
  { id: "fanta", name: "Fanta Ki Badi Bottle", price: 49, icon: "🧃" },
  { id: "ration", name: "Chai-Nashta", price: 79, icon: "☕" },
  { id: "server", name: "Zynox Recharge Fund", price: 349, icon: "📱" }
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
  if (id === "pizza") return "Help keep the admin fed while Zynox keeps moving.";
  if (id === "fanta") return "A tiny refreshment for the person keeping the server alive.";
  if (id === "ration") return "Help stock up the admin's virtual-world survival supplies.";
  if (id === "server") return "A little boost for the Zynox journey. 🚀";
  return "Every little bit helps keep Zynox running.";
}

function addBuyHandlers() {
  document.querySelectorAll(".donation-button").forEach(button => {
    button.addEventListener("click", () => {
      const product = button.dataset.product;
      const price = button.dataset.price;
      window.location.href =
        `/checkout.html?product=${encodeURIComponent(product)}&price=${encodeURIComponent(price)}`;
    });
  });
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
      <p class="rank-description">${escapeHtml(getDonationDescription(id))}</p>
      <div class="perks">
        <div class="perk">◆ Good vibes delivered 😎</div>
        ${id === "pizza" ? '<div class="perk">🥤 Admin ki Fanta incoming 😎</div>' :
          id === "fanta" ? '<div class="perk">🥤 Badi bottle, badi khushi 😂</div><div class="perk">◆ Admin approved ✅</div>' :
          id === "ration" ? '<div class="perk">☕ Chai-Nashta unlocked</div><div class="perk">😎 Admin ka mood set</div>' :
          id === "server" ? '<div class="perk">📱 Recharge fund me gaya</div><div class="perk">😂 Net chalu = Zynox chalu</div>' :
          '<div class="perk">😎 Bas chill, tumne apna kaam kar diya</div>'}
      </div>
      <button class="buy-button donation-button" data-product="${name}" data-price="${price}">
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
    <p class="rank-description">Pick your own amount and send some good vibes to Zynox. 😎</p>
    <div class="perks">
      <div class="perk">❤ Jitna mann kare, utna hi</div>
      <div class="perk">◆ Apna message bhi chhod sakte ho</div>
      <div class="perk">😎 Baaki vibe Admin sambhal lega</div>
    </div>
    <button class="buy-button donation-button custom-donation-button" data-product="Custom Donation" data-price="custom">
      CHOOSE AMOUNT →
    </button>
  `;
  productContainer.appendChild(customCard);

  addBuyHandlers();
}

async function loadProducts() {
  try {
    const response = await fetch("/api/products", { cache: "no-store" });
    if (!response.ok) throw new Error("Products endpoint unavailable");

    const data = await response.json();
    if (!data.success || !Array.isArray(data.products)) {
      throw new Error("Invalid products response");
    }

    renderProducts(data.products);
  } catch (error) {
    console.warn("[Zynox More] Using fallback products:", error);
    renderProducts(fallbackProducts);
  }
}

loadProducts();

const menuToggle = document.querySelector(".zy-menu-toggle");
const menuPanel = document.querySelector(".zy-menu-panel");

menuToggle?.addEventListener("click", function () {
  const open = this.getAttribute("aria-expanded") === "true";
  this.setAttribute("aria-expanded", String(!open));
  menuPanel?.setAttribute("aria-hidden", String(open));
  menuPanel?.classList.toggle("is-open", !open);
});

document.querySelectorAll(".zy-menu-panel a").forEach(link => {
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    menuPanel?.setAttribute("aria-hidden", "true");
    menuPanel?.classList.remove("is-open");
  });
});
