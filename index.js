const express = require("express");
const fs = require("fs");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 3001;

const CONFIG_PATH = "./config.json";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(express.json());
app.use(express.static("public"));

app.get("/api/products", (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    const products = Object.entries(config.ranks || {}).map(([id, rank]) => ({
      id,
      name: rank.name,
      price: rank.price,
      perks: {
        homes: rank.homes ?? 0,
        title: rank.title ?? null,
        particles: rank.particles ?? 0,
        join_effect: rank.join_effect ?? false,
        kill_effect: rank.kill_effect ?? false
      }
    }));

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error("[Zynox Shop] Product load error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load products"
    });
  }
});

app.post("/api/create-order", async (req, res) => {
  try {
    const { product, username } = req.body;

    if (!product || !username) {
      return res.status(400).json({
        success: false,
        message: "Product and username are required"
      });
    }

    if (
      username.length < 3 ||
      username.length > 32 ||
      !/^[A-Za-z0-9_ .-]+$/.test(username)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Minecraft username"
      });
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    const rankEntry = Object.entries(config.ranks || {}).find(
      ([, rank]) => rank.name === product
    );

    if (!rankEntry) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const [productId, rank] = rankEntry;
    const amount = Math.round(Number(rank.price) * 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price"
      });
    }

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `zynox_${productId}_${Date.now()}`,
      notes: {
        username,
        product: rank.name,
        product_id: productId
      }
    });

    res.json({
      success: true,
      key_id: process.env.RAZORPAY_KEY_ID,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      product: rank.name,
      username
    });
  } catch (error) {
    console.error("[Zynox Shop] Razorpay order error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create payment order"
    });
  }
});

app.listen(PORT, () => {
  console.log("ZynoxSMP Shop running on port " + PORT);
});
