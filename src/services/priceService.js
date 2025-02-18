import { updateEtfPrice, getEtfPrice } from "./dynamoService";

// Replace this URL with your actual AWS API Gateway Invoke URL
const AWS_API_URL =
  "https://c3bnm2s8z6.execute-api.us-east-2.amazonaws.com/prod";

export const updatePrices = async (ticker) => {
  try {
    // Call your scraper service
    const response = await fetch(
      "https://investment-dashboard-scraper.onrender.com/scrape-price",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch price for ${ticker}`);
    }

    const data = await response.json();

    if (!data.price) {
      throw new Error(`No price data returned for ${ticker}`);
    }

    // Update DynamoDB instead of Firebase
    await updateEtfPrice(ticker, data.price);

    return {
      success: true,
      price: data.price,
      ticker,
    };
  } catch (error) {
    console.error("Error updating price:", error);
    return {
      success: false,
      error: error.message,
      ticker,
    };
  }
};

// Function to update multiple tickers
export const updateMultiplePrices = async (tickers) => {
  const results = [];
  for (const ticker of tickers) {
    const result = await updatePrices(ticker);
    results.push(result);
    // Add a small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return results;
};

// New function to get current price
export const getCurrentPrice = async (ticker) => {
  try {
    const etfData = await getEtfPrice(ticker);
    return etfData?.currentPrice || null;
  } catch (error) {
    console.error("Error getting price:", error);
    return null;
  }
};
