export const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export const VALID_TICKERS = [
  "YMAG",
  "YMAX",
  "LFGY",
  "GPTY",
  "TSLY",
  "GOOY",
  "YBIT",
  "OARK",
  "XOMO",
  "TSMY",
  "CRSH",
  "FIVY",
  "FEAT",
  "NVDY",
  "FBY",
  "GDXY",
  "JPMO",
  "MRNY",
  "MARO",
  "PLTY",
  "CONY",
  "MSFO",
  "AMDY",
  "NFLY",
  "PYPY",
  "ULTY",
  "ABNY",
  "MSTY",
  "AMZY",
  "APLY",
  "DISO",
  "SQY",
  "SMCY",
  "AIYY",
];

export const ETF_GROUPS = {
  WEEKLY: ["YMAG", "YMAX", "LFGY", "GPTY"],
  GROUP_A: [
    "TSLY",
    "GOOY",
    "YBIT",
    "OARK",
    "XOMO",
    "TSMY",
    "CRSH",
    "FIVY",
    "FEAT",
  ],
  GROUP_B: ["NVDY", "FBY", "GDXY", "JPMO", "MRNY", "MARO", "PLTY"],
  GROUP_C: ["CONY", "MSFO", "AMDY", "NFLY", "PYPY", "ULTY", "ABNY"],
  GROUP_D: ["MSTY", "AMZY", "APLY", "DISO", "SQY", "SMCY", "AIYY"],
};

// Helper function to generate monthly dividend amounts with slight variations
const generateYearlyDividends = (baseAmount) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((month) => ({
    month,
    amount: +(baseAmount + (Math.random() * 0.06 - 0.03)).toFixed(2), // Varies by ±0.03
  }));
};

export const MOCK_DIVIDEND_DATA = {
  // WEEKLY Group
  YMAG: generateYearlyDividends(0.26),
  YMAX: generateYearlyDividends(0.26),
  LFGY: generateYearlyDividends(0.26),
  GPTY: generateYearlyDividends(0.26),

  // GROUP A
  TSLY: generateYearlyDividends(0.85),
  GOOY: generateYearlyDividends(0.95),
  YBIT: generateYearlyDividends(0.88),
  OARK: generateYearlyDividends(0.92),
  XOMO: generateYearlyDividends(0.83),
  TSMY: generateYearlyDividends(0.9),
  CRSH: generateYearlyDividends(0.87),
  FIVY: generateYearlyDividends(0.89),
  FEAT: generateYearlyDividends(0.91),

  // GROUP B
  NVDY: generateYearlyDividends(0.86),
  FBY: generateYearlyDividends(0.84),
  GDXY: generateYearlyDividends(0.88),
  JPMO: generateYearlyDividends(0.85),
  MRNY: generateYearlyDividends(0.93),
  MARO: generateYearlyDividends(0.94),
  PLTY: generateYearlyDividends(0.94),

  // GROUP C
  CONY: generateYearlyDividends(0.94),
  MSFO: generateYearlyDividends(0.94),
  AMDY: generateYearlyDividends(0.94),
  NFLY: generateYearlyDividends(0.94),
  PYPY: generateYearlyDividends(0.94),
  ULTY: generateYearlyDividends(0.94),
  ABNY: generateYearlyDividends(0.94),

  // GROUP D
  MSTY: generateYearlyDividends(0.94),
  AMZY: generateYearlyDividends(0.94),
  APLY: generateYearlyDividends(0.94),
  DISO: generateYearlyDividends(0.94),
  SQY: generateYearlyDividends(0.94),
  SMCY: generateYearlyDividends(0.94),
  AIYY: generateYearlyDividends(0.94),
};

// Helper function to get ETF group
export const getETFGroup = (ticker) => {
  for (const [group, tickers] of Object.entries(ETF_GROUPS)) {
    if (tickers.includes(ticker)) {
      return group;
    }
  }
  return "UNKNOWN";
};

// Helper to get next dividend date and amount
export const getNextDividend = (ticker) => {
  const today = new Date();
  const currentMonth = today.toLocaleString("default", { month: "short" });
  const dividends = MOCK_DIVIDEND_DATA[ticker];

  if (!dividends) return null;

  // Find the next dividend after current month
  const nextDividend =
    dividends.find(
      (div) =>
        new Date(`${div.month} 1, 2024`) > new Date(`${currentMonth} 1, 2024`)
    ) || dividends[0]; // If not found, return January's dividend

  return nextDividend;
};

export const STORAGE_KEY = "yieldmax_portfolio";
