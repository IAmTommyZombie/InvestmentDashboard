const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const initETF = require("./models/etf");
const initPriceHistory = require("./models/priceHistory");
const priceService = require("./services/priceService");
const { scrapePriceForTicker, updatePrices } = require("./scripts/scraper");

// Initialize Firebase first
const serviceAccount = require("./service-account-key.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Then initialize the database and ETF model
const db = admin.firestore();
const ETF = initETF(db);
const PriceHistory = initPriceHistory(db);

// Initialize express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Test Firebase connection
app.get("/test-firebase", async (req, res) => {
  try {
    await db.collection("etfs").doc("test").set({
      test: "Hello Firebase!",
    });
    res.json({ status: "Firebase connection successful" });
  } catch (error) {
    console.error("Firebase Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Add this new endpoint to check stored data
app.get("/check-prices", async (req, res) => {
  try {
    const snapshot = await db.collection("etfs").get();
    const prices = {};
    snapshot.forEach((doc) => {
      prices[doc.id] = doc.data();
    });
    res.json(prices);
  } catch (error) {
    console.error("Error checking prices:", error);
    res.status(500).json({ error: error.message });
  }
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

app.post("/scrape-price", async (req, res) => {
  try {
    const { ticker } = req.body;
    console.log("Received request for ticker:", ticker);

    if (!ticker) {
      console.error("No ticker provided");
      return res.status(400).json({ error: "Ticker is required" });
    }

    console.log(`Starting price scrape for ${ticker}...`);
    const price = await scrapePriceForTicker(ticker);
    console.log(`Successfully scraped price for ${ticker}: ${price}`);

    res.json({
      success: true,
      message: `Price updated for ${ticker}`,
      price: price,
      ticker: ticker,
    });
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      ticker: req.body.ticker,
    });

    res.status(500).json({
      error: error.message,
      details: error.stack,
      ticker: req.body.ticker,
    });
  }
});

// Update prices endpoint
app.get("/update-prices", async (req, res) => {
  try {
    await updatePrices(ETF, PriceHistory);
    res.json({ status: "Prices updated successfully" });
  } catch (error) {
    console.error("Error updating prices:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
