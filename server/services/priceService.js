const PriceHistory = require("../models/priceHistory");
const { FALLBACK_PRICES } = require("../config/fallbackPrices");

class PriceService {
  async getLatestPrice(ticker) {
    try {
      // First try to get from database
      const latestPrice = await PriceHistory.findOne({ ticker })
        .sort({ timestamp: -1 })
        .limit(1);

      if (latestPrice) {
        return {
          price: latestPrice.price,
          distribution: FALLBACK_PRICES[ticker].distribution,
          source: "database",
          timestamp: latestPrice.timestamp,
        };
      }

      // If no price in database, use fallback
      if (FALLBACK_PRICES[ticker]) {
        return {
          ...FALLBACK_PRICES[ticker],
          source: "fallback",
          timestamp: new Date(),
        };
      }

      throw new Error(`No price data available for ${ticker}`);
    } catch (error) {
      console.error(`Error getting price for ${ticker}:`, error);

      // Last resort: return fallback if available
      if (FALLBACK_PRICES[ticker]) {
        return {
          ...FALLBACK_PRICES[ticker],
          source: "fallback",
          timestamp: new Date(),
        };
      }

      throw error;
    }
  }

  async getLatestPrices() {
    try {
      // Get all prices from database
      const latestPrices = await PriceHistory.aggregate([
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: "$ticker",
            price: { $first: "$price" },
            timestamp: { $first: "$timestamp" },
          },
        },
      ]);

      // Create a map of database prices
      const dbPrices = new Map(
        latestPrices.map((price) => [
          price._id,
          {
            price: price.price,
            timestamp: price.timestamp,
          },
        ])
      );

      // Combine with fallback prices
      return Object.entries(FALLBACK_PRICES).map(([ticker, fallback]) => {
        const dbPrice = dbPrices.get(ticker);
        return {
          ticker,
          price: dbPrice ? dbPrice.price : fallback.price,
          distribution: fallback.distribution,
          source: dbPrice ? "database" : "fallback",
          timestamp: dbPrice ? dbPrice.timestamp : new Date(),
        };
      });
    } catch (error) {
      console.error("Error getting latest prices:", error);

      // Return all fallback prices if database fails
      return Object.entries(FALLBACK_PRICES).map(([ticker, data]) => ({
        ticker,
        ...data,
        source: "fallback",
        timestamp: new Date(),
      }));
    }
  }

  async updatePrice(ticker, price) {
    try {
      const priceHistory = new PriceHistory({
        ticker,
        price,
        timestamp: new Date(),
      });
      await priceHistory.save();
      return priceHistory;
    } catch (error) {
      console.error(`Error updating price for ${ticker}:`, error);
      throw error;
    }
  }
}

module.exports = new PriceService();
