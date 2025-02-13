import { db } from "../firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

export const DISTRIBUTIONS = {
  // Weekly distributions
  YMAG: {
    frequency: "weekly",
    history: {
      2025: {
        1: 0.16,
        2: 0.19,
        3: "TBD",
        4: 0.19,
        5: 0.19,
        6: 0.19,
        7: 0.19,
        8: 0.19,
      },
    },
  },
  YMAX: {
    frequency: "weekly",
    history: {
      2025: {
        1: 0.15,
        2: 0.19,
        3: "TBD",
      },
    },
  },
  LFGY: {
    frequency: "weekly",
    history: {
      2025: {
        1: 0.69,
        2: 0.69,
        3: "TBD",
      },
    },
  },
  GPTY: {
    frequency: "weekly",
    history: {
      2025: {
        1: "TBD",
        2: 0.34,
        3: "TBD",
      },
    },
  },

  // Group A - 13x frequency
  TSLY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.72,
        2: "TBD",
      },
    },
  },
  GOOY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.33,
        2: "TBD",
      },
    },
  },
  YBIT: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.79,
        2: "TBD",
      },
    },
  },
  OARK: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.33,
        2: "TBD",
      },
    },
  },
  XOMO: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.35,
        2: "TBD",
      },
    },
  },
  TSMY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.65,
        2: "TBD",
      },
    },
  },
  CRSH: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.29,
        2: "TBD",
      },
    },
  },
  FIVY: {
    frequency: "13x",
    history: {
      2025: {
        1: 1.68,
        2: "TBD",
      },
    },
  },
  FEAT: {
    frequency: "13x",
    history: {
      2025: {
        1: 2.2,
        2: "TBD",
      },
    },
  },

  // Group B - 13x frequency
  NVDY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.87,
        2: "TBD",
      },
    },
  },
  FBY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.54,
        2: "TBD",
      },
    },
  },
  GDXY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.48,
        2: "TBD",
      },
    },
  },
  JPMO: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.5,
        2: "TBD",
      },
    },
  },
  MRNY: {
    frequency: "13x",
    history: {
      2025: {
        1: 0.26,
        2: "TBD",
      },
    },
  },
  MARO: {
    frequency: "13x",
    history: {
      2025: {
        1: 2.3,
        2: "TBD",
      },
    },
  },
  PLTY: {
    frequency: "13x",
    history: {
      2025: {
        1: 1.68,
        2: "TBD",
      },
    },
  },

  // Group C - Monthly frequency
  CONY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.83,
        2: 1.05,
      },
    },
  },
  MSFO: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.37,
        2: 0.36,
      },
    },
  },
  AMDY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.34,
        2: 0.38,
      },
    },
  },
  NFLY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.58,
        2: 1.07,
      },
    },
  },
  PYPY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.43,
        2: 0.67,
      },
    },
  },
  ULTY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.57,
        2: 0.54,
      },
    },
  },
  ABNY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.42,
        2: 0.4,
      },
    },
  },

  // Group D - Monthly frequency
  MSTY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 2.28,
        2: "TBD",
      },
    },
  },
  AMZY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.4,
        2: "TBD",
      },
    },
  },
  APLY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.28,
        2: "TBD",
      },
    },
  },
  DISO: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.28,
        2: "TBD",
      },
    },
  },
  SQY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.63,
        2: "TBD",
      },
    },
  },
  SMCY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 1.72,
        2: "TBD",
      },
    },
  },
  AIYY: {
    frequency: "monthly",
    history: {
      2025: {
        1: 0.38,
        2: "TBD",
      },
    },
  },
};

// Helper function to get frequency multiplier (still needed for calculations)
export const getFrequencyMultiplier = (ticker) => {
  const weeklyETFs = ["YMAG", "YMAX", "LFGY", "GPTY"];
  if (weeklyETFs.includes(ticker)) {
    return 52 / 12; // Weekly to monthly conversion
  }
  return 1; // Monthly ETFs
};

// Get distribution from Firebase
export const getDistribution = async (ticker, year, month) => {
  // Add input validation
  if (!ticker || !year || month === undefined) {
    console.warn("Invalid parameters for getDistribution:", {
      ticker,
      year,
      month,
    });
    return 0;
  }

  try {
    const distributionsRef = collection(db, "yahoo_distributions");
    const q = query(
      distributionsRef,
      where("ticker", "==", ticker),
      where("year", "==", year),
      where("month", "==", month)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].data().amount;
    }

    return 0; // Return 0 if no distribution found
  } catch (error) {
    console.error(`Error getting distribution for ${ticker}:`, error);
    return 0;
  }
};

export const getMonthDistributions = (year, month) => {
  const distributions = {};
  for (const [ticker, data] of Object.entries(DISTRIBUTIONS)) {
    if (data.history?.[year]?.[month] !== undefined) {
      distributions[ticker] = data.history[year][month];
    }
  }
  return distributions;
};
