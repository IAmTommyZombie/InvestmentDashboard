export const ETF_DATA = {
  // Weekly ETFs
  YMAG: {
    frequency: "weekly",
    group: "WEEKLY",
    name: "YieldMax AAPL Option Income Strategy ETF",
    inception: "2023-08-23",
  },
  YMAX: {
    frequency: "weekly",
    group: "WEEKLY",
    name: "YieldMax TSLA Option Income Strategy ETF",
    inception: "2023-07-24",
  },
  LFGY: {
    frequency: "weekly",
    group: "WEEKLY",
    name: "Leverage Shares FAANG & Growth ETP",
    inception: "2023-09-14",
  },
  GPTY: {
    frequency: "weekly",
    group: "WEEKLY",
    name: "Growth Property & Technology ETF",
    inception: "2023-10-02",
  },

  // Group A (13x)
  TSLY: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax TSLA Option Income Strategy ETF",
    inception: "2023-07-24",
  },
  GOOY: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax GOOGL Option Income Strategy ETF",
    inception: "2023-08-14",
  },
  YBIT: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax Bitcoin Option Income Strategy ETF",
    inception: "2023-08-23",
  },
  OARK: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax Innovation Option Income Strategy ETF",
    inception: "2023-08-30",
  },
  XOMO: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax XOMOX Option Income Strategy ETF",
    inception: "2023-09-11",
  },
  TSMY: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax TSMC Option Income Strategy ETF",
    inception: "2023-09-18",
  },
  CRSH: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax Crushing It Option Income Strategy ETF",
    inception: "2023-09-25",
  },
  FIVY: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax FIVE Option Income Strategy ETF",
    inception: "2023-10-02",
  },
  FEAT: {
    frequency: "13x",
    group: "GROUP_A",
    name: "YieldMax FEAT Option Income Strategy ETF",
    inception: "2023-10-09",
  },

  // Group B (13x)
  NVDY: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax NVDA Option Income Strategy ETF",
    inception: "2023-10-16",
  },
  FBY: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax META Option Income Strategy ETF",
    inception: "2023-10-23",
  },
  GDXY: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax GDX Option Income Strategy ETF",
    inception: "2023-10-30",
  },
  JPMO: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax JPM Option Income Strategy ETF",
    inception: "2023-11-06",
  },
  MRNY: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax MRNA Option Income Strategy ETF",
    inception: "2023-11-13",
  },
  MARO: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax MSTR Option Income Strategy ETF",
    inception: "2023-11-20",
  },
  PLTY: {
    frequency: "13x",
    group: "GROUP_B",
    name: "YieldMax PLTR Option Income Strategy ETF",
    inception: "2023-11-27",
  },

  // Group C (Monthly)
  CONY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax COIN Option Income Strategy ETF",
    inception: "2023-12-04",
  },
  MSFO: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax MSFT Option Income Strategy ETF",
    inception: "2023-12-11",
  },
  AMDY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax AMD Option Income Strategy ETF",
    inception: "2023-12-18",
  },
  NFLY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax NFLX Option Income Strategy ETF",
    inception: "2023-12-26",
  },
  PYPY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax PYPL Option Income Strategy ETF",
    inception: "2024-01-02",
  },
  ULTY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax QQQ Option Income Strategy ETF",
    inception: "2024-01-08",
  },
  ABNY: {
    frequency: "monthly",
    group: "GROUP_C",
    name: "YieldMax ABNB Option Income Strategy ETF",
    inception: "2024-01-16",
  },

  // Group D (Monthly)
  MSTY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax MSFT Option Income Strategy ETF",
    inception: "2024-01-22",
  },
  AMZY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax AMZN Option Income Strategy ETF",
    inception: "2024-01-29",
  },
  APLY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax AAPL Option Income Strategy ETF",
    inception: "2024-02-05",
  },
  DISO: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax DIS Option Income Strategy ETF",
    inception: "2024-02-12",
  },
  SQY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax SQ Option Income Strategy ETF",
    inception: "2024-02-20",
  },
  SMCY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax SMH Option Income Strategy ETF",
    inception: "2024-02-26",
  },
  AIYY: {
    frequency: "monthly",
    group: "GROUP_D",
    name: "YieldMax AI Option Income Strategy ETF",
    inception: "2024-03-04",
  },
};

export const STATUS_STYLES = {
  active: {
    bg: "bg-green-100",
    text: "text-green-800",
    border: "border-green-200",
    hover: "hover:bg-green-50",
  },
  pending: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    border: "border-yellow-200",
    hover: "hover:bg-yellow-50",
  },
  suspended: {
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
    hover: "hover:bg-red-50",
  },
};

export const GROUP_ORDER = [
  "WEEKLY",
  "GROUP_A",
  "GROUP_B",
  "GROUP_C",
  "GROUP_D",
];

export const getETFStatus = (price, distribution) => {
  if (!price || price === "TBD") return "pending";
  if (distribution === "TBD") return "pending";
  if (distribution === "N/A") return "suspended";
  return "active";
};
