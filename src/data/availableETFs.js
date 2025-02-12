import { DISTRIBUTIONS } from "./distributions";

export const availableETFs = Object.entries(DISTRIBUTIONS).map(
  ([ticker, data]) => ({
    ticker,
    frequency: data.frequency,
    group: getGroupFromFrequency(data.frequency),
    name: getETFName(ticker),
  })
);

function getGroupFromFrequency(frequency) {
  switch (frequency) {
    case "weekly":
      return "WEEKLY";
    case "13x":
      return frequency.includes("A") ? "GROUP_A" : "GROUP_B";
    case "monthly":
      return frequency.includes("C") ? "GROUP_C" : "GROUP_D";
    default:
      return "";
  }
}

function getETFName(ticker) {
  const names = {
    YMAG: "YieldMax AAPL Option Income Strategy ETF",
    YMAX: "YieldMax TSLA Option Income Strategy ETF",
    LFGY: "Leverage Shares FAANG+ ETF",
    GPTY: "Growth Property Trust ETF",
    TSLY: "YieldMax TSLA Option Income Strategy ETF",
    // Add more names as needed
  };
  return names[ticker] || `${ticker} ETF`;
}
