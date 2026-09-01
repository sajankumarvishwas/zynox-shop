const express = require("express");
const fs = require("fs");

const app = express();
const PORT = 3001;

const CONFIG_PATH = "/data/data/com.termux/files/home/zynox-ranks/config.json";

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

app.listen(PORT, () => {
  console.log("ZynoxSMP Shop running on port " + PORT);
});
