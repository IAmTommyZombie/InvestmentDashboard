export const DISTRIBUTIONS = {
  2025: {
    1: {
      // January
      // WEEKLY
      YMAG: 0.25,
      YMAX: 0.25,
      LFGY: 0.25,
      GPTY: 0.25,
      // GROUP A
      TSLY: 0.25,
      GOOY: 0.25,
      YBIT: 0.25,
      OARK: 0.25,
      XOMO: 0.25,
      TSMY: 0.25,
      CRSH: 0.25,
      FIVY: 0.25,
      FEAT: 0.25,
      // GROUP B
      NVDY: 0.25,
      FBY: 0.25,
      GDXY: 0.25,
      JPMO: 0.25,
      MRNY: 0.25,
      MARO: 0.25,
      PLTY: 0.25,
      // GROUP C
      CONY: 0.25,
      MSFO: 0.25,
      AMDY: 0.25,
      NFLY: 0.25,
      PYPY: 0.25,
      ULTY: 0.25,
      ABNY: 0.25,
      // GROUP D
      MSTY: 0.25,
      AMZY: 0.25,
      APLY: 0.25,
      DISO: 0.25,
      SQY: 0.25,
      SMCY: 0.25,
      AIYY: 0.25,
    },
    2: {
      // February
      // Same structure as January
      // You can modify individual values as needed
    },
    3: {
      // March
      // Same structure as January
      // You can modify individual values as needed
    },
    4: {
      // April
      // Same structure as January
      // You can modify individual values as needed
    },
    5: {
      // May
      // Same structure as January
      // You can modify individual values as needed
    },
    6: {
      // June
      // Same structure as January
      // You can modify individual values as needed
    },
    7: {
      // July
      // Same structure as January
      // You can modify individual values as needed
    },
    8: {
      // August
      // Same structure as January
      // You can modify individual values as needed
    },
    9: {
      // September
      // Same structure as January
      // You can modify individual values as needed
    },
    10: {
      // October
      // Same structure as January
      // You can modify individual values as needed
    },
    11: {
      // November
      // Same structure as January
      // You can modify individual values as needed
    },
    12: {
      // December
      // Same structure as January
      // You can modify individual values as needed
    },
  },
};

// Helper function to get distribution for a specific ETF in a given month/year
export const getDistribution = (ticker, year, month) => {
  if (
    DISTRIBUTIONS[year] &&
    DISTRIBUTIONS[year][month] &&
    DISTRIBUTIONS[year][month][ticker]
  ) {
    return DISTRIBUTIONS[year][month][ticker];
  }

  // If not found, find the latest available distribution for this ticker
  const years = Object.keys(DISTRIBUTIONS).sort((a, b) => b - a);

  for (const y of years) {
    const months = Object.keys(DISTRIBUTIONS[y]).sort((a, b) => b - a);
    for (const m of months) {
      if (DISTRIBUTIONS[y][m][ticker]) {
        return DISTRIBUTIONS[y][m][ticker];
      }
    }
  }

  return 0;
};

// Optional: Helper function to get all distributions for a specific month/year
export const getMonthDistributions = (year, month) => {
  if (DISTRIBUTIONS[year] && DISTRIBUTIONS[year][month]) {
    return DISTRIBUTIONS[year][month];
  }
  return {};
};
