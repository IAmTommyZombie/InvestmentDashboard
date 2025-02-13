const axios = require("axios");

// Remove all playwright imports and old code

async function scrapeETFPrice(symbol) {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );
    const price = response.data.chart.result[0].meta.regularMarketPrice;
    return price;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return null;
  }
}

async function updatePrices(ETF, PriceHistory) {
  const symbols = ["JEPI", "JEPQ", "SCHD"];

  for (const symbol of symbols) {
    try {
      const price = await scrapeETFPrice(symbol);
      if (price) {
        // Update current price
        await ETF.findOneAndUpdate(
          { symbol },
          { $set: { price, lastUpdated: new Date() } },
          { upsert: true }
        );

        // Add to price history
        await PriceHistory.create({
          symbol,
          price,
          date: new Date(),
        });

        console.log(`Updated ${symbol}: $${price}`);
      }
    } catch (error) {
      console.error(`Error updating ${symbol}:`, error);
    }
  }
}

module.exports = { updatePrices };
