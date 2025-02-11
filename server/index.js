const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const ETF = require("./models/etf");
const PriceHistory = require("./models/priceHistory");
const priceService = require("./services/priceService");

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/portfolio")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ETF Routes
app.get("/api/etfs", async (req, res) => {
  try {
    const etfs = await ETF.find();
    // Enhance ETFs with latest prices
    const enhancedEtfs = await Promise.all(
      etfs.map(async (etf) => {
        const priceData = await priceService.getLatestPrice(etf.ticker);
        return {
          ...etf.toObject(),
          currentPrice: priceData.price,
          distribution: priceData.distribution,
        };
      })
    );
    res.json(enhancedEtfs);
  } catch (error) {
    console.error("Error fetching ETFs:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/etfs", async (req, res) => {
  try {
    // Get latest price data for the ticker
    const priceData = await priceService.getLatestPrice(req.body.ticker);

    const etfData = {
      ...req.body,
      currentPrice: priceData.price,
      distribution: priceData.distribution,
    };

    const etf = new ETF(etfData);
    const newEtf = await etf.save();
    res.status(201).json(newEtf);
  } catch (error) {
    console.error("Error creating ETF:", error);
    res.status(400).json({ message: error.message });
  }
});

app.put("/api/etfs/:id", async (req, res) => {
  try {
    // Get latest price data if ticker is being updated
    let updateData = { ...req.body };
    if (req.body.ticker) {
      const priceData = await priceService.getLatestPrice(req.body.ticker);
      updateData.currentPrice = priceData.price;
      updateData.distribution = priceData.distribution;
    }

    const etf = await ETF.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!etf) {
      return res.status(404).json({ message: "ETF not found" });
    }
    res.json(etf);
  } catch (error) {
    console.error("Error updating ETF:", error);
    res.status(400).json({ message: error.message });
  }
});

// Price Routes
app.get("/api/prices/latest", async (req, res) => {
  try {
    const prices = await priceService.getLatestPrices();
    res.json(prices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/prices/:ticker", async (req, res) => {
  try {
    const price = await priceService.getLatestPrice(req.params.ticker);
    res.json(price);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Keep your existing ETF deletion and purchase endpoints
app.delete("/api/etfs/:id", async (req, res) => {
  try {
    const etf = await ETF.findByIdAndDelete(req.params.id);
    if (!etf) {
      return res.status(404).json({ message: "ETF not found" });
    }
    res.json({ message: "ETF deleted" });
  } catch (error) {
    console.error("Error deleting ETF:", error);
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/etfs/:id/purchases", async (req, res) => {
  try {
    console.log("Adding purchase. ETF ID:", req.params.id);
    console.log("Purchase data:", req.body);

    const etf = await ETF.findById(req.params.id);
    if (!etf) {
      console.log("ETF not found");
      return res.status(404).json({ message: "ETF not found" });
    }

    // Ensure purchases array exists
    if (!etf.purchases) {
      etf.purchases = [];
    }

    // Add initial purchase if array is empty
    if (etf.purchases.length === 0) {
      etf.purchases.push({
        date: etf.purchaseDate,
        shares: Number(etf.shares),
        price: Number(etf.costBasis),
      });
    }

    // Add new purchase
    const newPurchase = {
      date: new Date(req.body.date),
      shares: Number(req.body.shares),
      price: Number(req.body.price),
    };
    etf.purchases.push(newPurchase);

    // Calculate new totals
    let totalCost = 0;
    let totalShares = 0;

    etf.purchases.forEach((purchase) => {
      const shares = Number(purchase.shares);
      const price = Number(purchase.price);
      totalShares += shares;
      totalCost += shares * price;
    });

    // Update ETF
    etf.shares = totalShares;
    etf.costBasis = totalCost / totalShares;

    // Get latest price data
    const priceData = await priceService.getLatestPrice(etf.ticker);
    etf.currentPrice = priceData.price;

    const updatedEtf = await etf.save();
    res.json(updatedEtf);
  } catch (error) {
    console.error("Error in purchase endpoint:", error);
    res.status(500).json({ message: error.message });
  }
});

// Start server
const PORT = 3500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
