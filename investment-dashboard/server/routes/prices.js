const express = require("express");
const router = express.Router();
const priceService = require("../services/priceService");

// Get latest price for a specific ticker
router.get("/latest/:ticker", async (req, res) => {
  try {
    const price = await priceService.getLatestPrice(req.params.ticker);
    res.json(price);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all latest prices
router.get("/latest", async (req, res) => {
  try {
    const prices = await priceService.getLatestPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
