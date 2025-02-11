import { MOCK_DIVIDEND_DATA } from "./constants";

export const calculateMonthlyDividends = (portfolio) => {
  const monthlyData = [];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  months.forEach((month) => {
    let totalDividend = 0;
    portfolio.forEach((etf) => {
      const dividendInfo = MOCK_DIVIDEND_DATA[etf.ticker]?.find(
        (d) => d.month === month
      );
      if (dividendInfo) {
        totalDividend += dividendInfo.amount * etf.shares;
      }
    });
    monthlyData.push({ month, totalDividend });
  });

  return monthlyData;
};

export const calculatePortfolioValue = (portfolio) => {
  return portfolio.reduce((acc, etf) => acc + etf.shares * etf.costBasis, 0);
};

export const validateETFInput = (etf, validTickers) => {
  if (!validTickers.includes(etf.ticker.toUpperCase())) {
    return {
      isValid: false,
      error: "Invalid ticker. Please use a valid YieldMax ETF ticker.",
    };
  }
  if (isNaN(etf.shares) || etf.shares <= 0) {
    return { isValid: false, error: "Please enter a valid number of shares." };
  }
  if (isNaN(etf.costBasis) || etf.costBasis <= 0) {
    return { isValid: false, error: "Please enter a valid cost basis." };
  }
  return { isValid: true, error: "" };
};
