import {
  getUserPortfolio,
  updatePortfolio,
  getEtfPrice,
} from "./dynamoService";

export const getPortfolio = async (userId) => {
  try {
    // Get user's portfolio holdings
    const holdings = await getUserPortfolio(userId);

    // Get current prices for all holdings
    const holdingsWithPrices = await Promise.all(
      holdings.map(async (holding) => {
        const etfData = await getEtfPrice(holding.ticker);
        return {
          ...holding,
          currentPrice: etfData?.currentPrice || 0,
          totalValue: (etfData?.currentPrice || 0) * holding.totalShares,
          gain:
            ((etfData?.currentPrice || 0) - holding.averageCost) *
            holding.totalShares,
        };
      })
    );

    return holdingsWithPrices;
  } catch (error) {
    console.error("Error getting portfolio:", error);
    throw error;
  }
};

export const updateHolding = async (userId, ticker, shares, averageCost) => {
  try {
    await updatePortfolio(userId, ticker, shares, averageCost);
    return true;
  } catch (error) {
    console.error("Error updating holding:", error);
    throw error;
  }
};

export const addNewHolding = async (userId, ticker, shares, averageCost) => {
  try {
    // Verify the ETF exists
    const etfData = await getEtfPrice(ticker);
    if (!etfData) {
      throw new Error("ETF not found");
    }

    // Add the holding
    await updatePortfolio(userId, ticker, shares, averageCost);
    return true;
  } catch (error) {
    console.error("Error adding new holding:", error);
    throw error;
  }
};

export const removeHolding = async (userId, ticker) => {
  try {
    // Set shares to 0 to effectively remove the holding
    await updatePortfolio(userId, ticker, 0, 0);
    return true;
  } catch (error) {
    console.error("Error removing holding:", error);
    throw error;
  }
};
