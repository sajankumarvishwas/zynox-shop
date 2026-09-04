const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3001;

const CONFIG_PATH = "./config.json";

app.use(express.json());
app.use(express.static("public"));

app.get("/api/products", (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

    const products = Object.entries(config.donations || {}).map(([id, donation]) => ({
      id,
      name: donation.name,
      price: donation.price,
      icon: donation.icon || "❤"
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
