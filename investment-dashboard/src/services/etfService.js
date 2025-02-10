const MOCK_PRICES = {
  // WEEKLY
  YMAG: { price: 15.23, change: 2.5, dividend: 125000 },
  YMAX: { price: 15.23, change: 2.5, dividend: 125000 },
  LFGY: { price: 15.23, change: 2.5, dividend: 125000 },
  GPTY: { price: 15.23, change: 2.5, dividend: 125000 },
  // GROUP A
  TSLY: { price: 15.23, change: 2.5, dividend: 125000 },
  GOOY: { price: 15.23, change: 2.5, dividend: 125000 },
  YBIT: { price: 15.23, change: 2.5, dividend: 125000 },
  OARK: { price: 15.23, change: 2.5, dividend: 125000 },
  XOMO: { price: 15.23, change: 2.5, dividend: 125000 },
  TSMY: { price: 15.23, change: 2.5, dividend: 125000 },
  CRSH: { price: 15.23, change: 2.5, dividend: 125000 },
  FIVY: { price: 15.23, change: 2.5, dividend: 125000 },
  FEAT: { price: 15.23, change: 2.5, dividend: 125000 },
  // GROUP B
  NVDY: { price: 16.42, change: 3.1, dividend: 145000 },
  FBY: { price: 16.42, change: 3.1, dividend: 145000 },
  GDXY: { price: 16.42, change: 3.1, dividend: 145000 },
  JPMO: { price: 16.42, change: 3.1, dividend: 145000 },
  MRNY: { price: 16.42, change: 3.1, dividend: 145000 },
  MARO: { price: 16.42, change: 3.1, dividend: 145000 },
  PLTY: { price: 16.42, change: 3.1, dividend: 145000 },
  // GROUP C
  CONY: { price: 15.89, change: 2.2, dividend: 132000 },
  MSFO: { price: 15.89, change: 2.2, dividend: 132000 },
  AMDY: { price: 15.89, change: 2.2, dividend: 132000 },
  NFLY: { price: 15.89, change: 2.2, dividend: 132000 },
  PYPY: { price: 15.89, change: 2.2, dividend: 132000 },
  ULTY: { price: 15.89, change: 2.2, dividend: 132000 },
  ABNY: { price: 15.89, change: 2.2, dividend: 132000 },
  // GROUP D
  MSTY: { price: 14.95, change: -0.5, dividend: 85000 },
  AMZY: { price: 15.45, change: 1.2, dividend: 115000 },
  APLY: { price: 14.78, change: -1.8, dividend: 92000 },
  DISO: { price: 15.65, change: 1.7, dividend: 108000 },
  SQY: { price: 15.92, change: 2.8, dividend: 138000 },
  SMCY: { price: 15.34, change: 1.1, dividend: 102000 },
  AIYY: { price: 15.34, change: 1.1, dividend: 102000 },
};

// Latest distribution amounts
export const DISTRIBUTIONS = {
  // WEEKLY
  YMAG: 0.26,
  YMAX: 0.26,
  LFGY: 0.26,
  GPTY: 0.26,
  // GROUP A
  TSLY: 0.85,
  GOOY: 0.95,
  YBIT: 0.88,
  OARK: 0.92,
  XOMO: 0.83,
  TSMY: 0.9,
  CRSH: 0.87,
  FIVY: 0.89,
  FEAT: 0.91,
  // GROUP B
  NVDY: 0.86,
  FBY: 0.84,
  GDXY: 0.88,
  JPMO: 0.85,
  MRNY: 0.93,
  MARO: 0.94,
  PLTY: 0.94,
  // GROUP C
  CONY: 0.94,
  MSFO: 0.94,
  AMDY: 0.94,
  NFLY: 0.94,
  PYPY: 0.94,
  ULTY: 0.94,
  ABNY: 0.94,
  // GROUP D
  MSTY: 0.94,
  AMZY: 0.94,
  APLY: 0.94,
  DISO: 0.94,
  SQY: 0.94,
  SMCY: 0.94,
  AIYY: 0.94,
};

// YieldMax ETFs organized by distribution groups
export const YIELDMAX_ETFS = {
  weekly: [
    {
      ticker: "YMAG",
      name: "YieldMax™ Magnificent 7 Fund of Option Income ETFs",
    },
    { ticker: "YMAX", name: "YieldMax™ Universe Fund of Option Income ETFs" },
    {
      ticker: "LFGY",
      name: "YieldMax™ Crypto Industry & Tech Portfolio Option Income ETF",
    },
    { ticker: "GPTY", name: "YieldMax™ AI & Tech Portfolio Option Income ETF" },
  ],
  seriesA: [
    { ticker: "TSLY", name: "YieldMax™ TSLA Option Income Strategy ETF" },
    { ticker: "GOOY", name: "YieldMax™ GOOGL Option Income Strategy ETF" },
    { ticker: "YBIT", name: "YieldMax™ Bitcoin Option Income Strategy ETF" },
    { ticker: "OARK", name: "YieldMax™ Innovation Option Income Strategy ETF" },
    { ticker: "XOMO", name: "YieldMax™ XOM Option Income Strategy ETF" },
    { ticker: "TSMY", name: "YieldMax™ TSM Option Income Strategy ETF" },
    { ticker: "CRSH", name: "YieldMax™ Short TSLA Option Income Strategy ETF" },
    { ticker: "FIVY", name: "YieldMax™ Dorsey Wright Hybrid 5 Income ETF" },
    { ticker: "FEAT", name: "YieldMax™ Dorsey Wright Featured 5 Income ETF" },
  ],
  seriesB: [
    { ticker: "NVDY", name: "YieldMax™ NVDA Option Income Strategy ETF" },
    { ticker: "FBY", name: "YieldMax™ META Option Income Strategy ETF" },
    {
      ticker: "GDXY",
      name: "YieldMax™ Gold Miners Option Income Strategy ETF",
    },
    { ticker: "JPMO", name: "YieldMax™ JPM Option Income Strategy ETF" },
    { ticker: "MRNY", name: "YieldMax™ MRNA Option Income Strategy ETF" },
    { ticker: "MARO", name: "YieldMax™ MARA Option Income Strategy ETF" },
    { ticker: "PLTY", name: "YieldMax™ PLTR Option Income Strategy ETF" },
  ],
  seriesC: [
    { ticker: "CONY", name: "YieldMax™ COIN Option Income Strategy ETF" },
    { ticker: "MSFO", name: "YieldMax™ MSFT Option Income Strategy ETF" },
    { ticker: "AMDY", name: "YieldMax™ AMD Option Income Strategy ETF" },
    { ticker: "NFLY", name: "YieldMax™ NFLX Option Income Strategy ETF" },
    { ticker: "PYPY", name: "YieldMax™ PYPL Option Income Strategy ETF" },
    { ticker: "ULTY", name: "YieldMax™ Ultra Option Income Strategy ETF" },
    { ticker: "ABNY", name: "YieldMax™ ABNB Option Income Strategy ETF" },
  ],
  seriesD: [
    { ticker: "MSTY", name: "YieldMax™ SPY Option Income Strategy ETF" },
    { ticker: "AMZY", name: "YieldMax™ AMZN Option Income Strategy ETF" },
    { ticker: "APLY", name: "YieldMax™ AAPL Option Income Strategy ETF" },
    { ticker: "DISO", name: "YieldMax™ DIS Option Income Strategy ETF" },
    { ticker: "SQY", name: "YieldMax™ SQ Option Income Strategy ETF" },
    { ticker: "SMCY", name: "YieldMax™ SMCI Option Income Strategy ETF" },
    { ticker: "AIYY", name: "YieldMax™ AI Option Income Strategy ETF" },
  ],
};

export const getETFData = async (ticker) => {
  console.log("Fetching data for ticker:", ticker);
  try {
    // Using mock data
    return {
      ticker,
      currentPrice: MOCK_PRICES[ticker]?.price || 0,
      timestamp: new Date(),
      dailyChange: MOCK_PRICES[ticker]?.change || 0,
      distribution: DISTRIBUTIONS[ticker] || 0,
    };
  } catch (error) {
    console.error("Error fetching ETF data:", error);
    throw error;
  }
};

export const getAllETFData = async () => {
  console.log("Getting all ETF data");
  try {
    const allETFs = Object.values(YIELDMAX_ETFS).flat();
    console.log("All ETFs:", allETFs);

    const etfData = await Promise.all(
      allETFs.map((etf) => getETFData(etf.ticker))
    );
    console.log("ETF Data fetched:", etfData);

    const result = Object.entries(YIELDMAX_ETFS).reduce(
      (acc, [series, etfs]) => {
        console.log("Processing series:", series);
        acc[series] = etfs.map((etf) => {
          const data = etfData.find((d) => d.ticker === etf.ticker);
          return {
            ...etf,
            ...data,
          };
        });
        return acc;
      },
      {}
    );

    console.log("Final processed data:", result);
    return result;
  } catch (error) {
    console.error("Error in getAllETFData:", error);
    throw error;
  }
};

export const getLatestDistribution = (ticker) => {
  return DISTRIBUTIONS[ticker] || 0;
};

export const getDistributionInfo = (series) => {
  const schedules = {
    weekly: "Distributed Weekly",
    seriesA: "Distributed 3rd Week of Month",
    seriesB: "Distributed 4th Week of Month",
    seriesC: "Distributed 1st Week of Month",
    seriesD: "Distributed 2nd Week of Month",
  };
  return schedules[series] || "";
};
