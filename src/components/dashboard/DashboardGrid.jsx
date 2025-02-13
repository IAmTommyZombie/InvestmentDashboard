import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  Timestamp,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { usePortfolio } from "../../context/PortfolioContext";
import { useDistribution } from "../../context/DistributionContext";
import { PieChart, BarChart3, DollarSign } from "lucide-react";
import {
  ETF_DATA,
  STATUS_STYLES,
  GROUP_ORDER,
  getETFStatus,
} from "../../data/etfMetadata";
import { formatCurrency } from "../../utils/formatters";
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
} from "@mui/material";

const FALLBACK_PRICES = {
  YMAG: { price: 18.0, quantity: 100 },
  YMAX: { price: 16.49, quantity: 100 },
  LFGY: { price: 47.8, quantity: 100 },
  GPTY: { price: 48.29, quantity: 100 },
  TSLY: { price: 11.51, quantity: 100 },
  GOOY: { price: 14.2, quantity: 100 },
  YBIT: { price: 11.96, quantity: 100 },
  OARK: { price: 10.6, quantity: 100 },
  XOMO: { price: 14.46, quantity: 100 },
  TSMY: { price: 18.36, quantity: 100 },
  CRSH: { price: 6.71, quantity: 100 },
  FIVY: { price: 45.94, quantity: 100 },
  FEAT: { price: 45.36, quantity: 100 },
  NVDY: { price: 20.55, quantity: 100 },
  FBY: { price: 20.86, quantity: 100 },
  GDXY: { price: 15.84, quantity: 100 },
  JPMO: { price: 19.15, quantity: 100 },
  MRNY: { price: 3.35, quantity: 100 },
  MARO: { price: 31.65, quantity: 100 },
  PLTY: { price: 88.69, quantity: 100 },
  CONY: { price: 11.94, quantity: 100 },
  MSFO: { price: 16.93, quantity: 100 },
  AMDY: { price: 8.73, quantity: 100 },
  NFLY: { price: 18.35, quantity: 100 },
  PYPY: { price: 15.0, quantity: 100 },
  ULTY: { price: 8.17, quantity: 100 },
  ABNY: { price: 14.91, quantity: 100 },
  MSTY: { price: 26.37, quantity: 100 },
  AMZY: { price: 19.46, quantity: 100 },
  APLY: { price: 16.78, quantity: 100 },
  DISO: { price: 16.27, quantity: 100 },
  SQY: { price: 16.52, quantity: 100 },
  SMCY: { price: 28.33, quantity: 100 },
  AIYY: { price: 7.62, quantity: 100 },
};

const ETF_GROUPS = {
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

const GROUP_NAMES = {
  WEEKLY: "Weekly Distributions",
  GROUP_A: "Group A - 13x/Year",
  GROUP_B: "Group B - 13x/Year",
  GROUP_C: "Group C - Monthly",
  GROUP_D: "Group D - Monthly",
};

const getGroupColor = (ticker) => {
  if (ETF_GROUPS.WEEKLY.includes(ticker)) return "bg-gray-50 hover:bg-gray-100";
  if (ETF_GROUPS.GROUP_A.includes(ticker))
    return "bg-green-50 hover:bg-green-100";
  if (ETF_GROUPS.GROUP_B.includes(ticker))
    return "bg-yellow-50 hover:bg-yellow-100";
  if (ETF_GROUPS.GROUP_C.includes(ticker))
    return "bg-blue-50 hover:bg-blue-100";
  if (ETF_GROUPS.GROUP_D.includes(ticker)) return "bg-red-50 hover:bg-red-100";
  return "bg-white hover:bg-gray-50";
};

export default function DashboardGrid() {
  const {
    etfs = [],
    totalValue = 0,
    totalShares = 0,
    portfolioEtfs = [],
  } = usePortfolio() || {};
  const {
    getLatestDistribution,
    getPaymentsPerYear,
    distributions = {},
    loading,
    monthlyDistribution,
  } = useDistribution() || {};
  const [prices, setPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [updatingETFs, setUpdatingETFs] = useState({});
  const [status, setStatus] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [groupProgress, setGroupProgress] = useState({});

  useEffect(() => {
    console.log("Setting up price listener");
    const pricesRef = collection(db, "etfs");

    const unsubscribe = onSnapshot(pricesRef, (snapshot) => {
      console.log("Fetching prices from Firebase...");
      const pricesData = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (!data.purchases && data.price && data.lastUpdated) {
          pricesData[doc.id] = {
            price: data.price,
            lastUpdated: data.lastUpdated,
          };
        }
      });

      console.log("Setting prices state:", pricesData);
      setPrices(pricesData);
      setPricesLoading(false);
    });

    return () => unsubscribe();
  }, []); // Only run once on mount

  const updateSingleETF = async (ticker) => {
    if (!ticker) return;
    console.log(`Starting update for ${ticker}`);

    setUpdatingETFs((prev) => ({ ...prev, [ticker]: true }));
    setStatus((prev) => ({ ...prev, [ticker]: "⏳ Scraping price..." }));

    try {
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
        const errorData = await response.json().catch(() => ({}));
        console.error("Server error details:", errorData);
        throw new Error(
          errorData.error || `Failed to scrape price for ${ticker}`
        );
      }

      const data = await response.json();
      console.log(`Received response for ${ticker}:`, data);

      // Add delay between Firestore operations
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Get the updated price from Firestore
      const priceRef = doc(db, "prices", ticker);
      let retries = 3;
      let priceDoc;

      while (retries > 0) {
        try {
          priceDoc = await getDoc(priceRef);
          break;
        } catch (error) {
          console.warn(`Retry ${4 - retries} failed for ${ticker}:`, error);
          retries--;
          if (retries === 0) throw error;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!priceDoc.exists()) {
        throw new Error(`No price data found for ${ticker}`);
      }

      const currentPrice = priceDoc.data().currentPrice;
      console.log(`Got fresh price for ${ticker}:`, currentPrice);

      setPrices((prev) => {
        const newPrices = {
          ...prev,
          [ticker]: {
            price: currentPrice,
            lastUpdated: new Date().toLocaleString(),
          },
        };
        console.log("New prices state:", newPrices);
        return newPrices;
      });

      setStatus((prev) => ({ ...prev, [ticker]: "✅ Updated!" }));
      setLastUpdateTime((prev) => ({
        ...prev,
        [ticker]: new Date().toLocaleString(),
      }));
    } catch (error) {
      console.error(`Error updating ${ticker}:`, error);
      setStatus((prev) => ({ ...prev, [ticker]: "❌ Failed to update" }));
    } finally {
      setUpdatingETFs((prev) => ({ ...prev, [ticker]: false }));
    }
  };

  const calculateAnnualYield = (etf) => {
    if (!etf?.ticker || !prices) return "N/A";

    const price = prices[etf.ticker]?.price;
    const distribution = getLatestDistribution(etf.ticker);

    if (
      !price ||
      distribution === "TBD" ||
      distribution === "N/A" ||
      isNaN(distribution)
    ) {
      return "TBD";
    }

    const paymentsPerYear = getPaymentsPerYear(etf.ticker);
    return (((distribution * paymentsPerYear) / price) * 100).toFixed(2);
  };

  const calculateMonthlyIncome = () => {
    if (!etfs || !Array.isArray(etfs)) return 0;

    return etfs.reduce((total, etf) => {
      const distribution = getLatestDistribution(etf?.ticker?.toUpperCase());
      if (!distribution || distribution === "N/A" || distribution === "TBD")
        return total;

      const paymentsPerYear = getPaymentsPerYear(etf?.ticker?.toUpperCase());
      const yearlyAmount = distribution * paymentsPerYear;
      const monthlyAmount = yearlyAmount / 12;
      return total + monthlyAmount * (etf?.shares || 0);
    }, 0);
  };

  const getNextDistributionDate = (frequency) => {
    const today = new Date();
    let nextDate = new Date();

    switch (frequency) {
      case "weekly":
        nextDate.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
        break;
      case "13x":
        const daysUntilNext13x =
          28 -
          (Math.floor((today - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24)) %
            28);
        nextDate.setDate(today.getDate() + daysUntilNext13x);
        break;
      default:
        nextDate.setMonth(today.getMonth() + 1, 1);
        break;
    }

    return nextDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const groupedETFs = Object.entries(ETF_DATA).reduce((acc, [ticker, data]) => {
    const { group } = data;

    if (!acc[group]) {
      acc[group] = [];
    }

    acc[group].push({
      ticker,
      ...data,
      currentPrice: prices[ticker]?.price || "TBD",
      distribution: getLatestDistribution(ticker) || "TBD",
      ...distributions[ticker],
    });

    return acc;
  }, {});

  if (loading || pricesLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  const monthlyIncome = calculateMonthlyIncome();

  const renderETFRow = (etf) => {
    const status = getETFStatus(
      prices[etf.ticker]?.price,
      getLatestDistribution(etf.ticker)
    );
    const statusStyles = STATUS_STYLES[status];

    const portfolioEntry = portfolioEtfs.find(
      (p) => p.ticker === etf.ticker && p.totalShares > 0
    );

    const isHeld = !!portfolioEntry;

    // Get the group color
    const getGroupBackgroundColor = (ticker) => {
      if (ETF_GROUPS.WEEKLY.includes(ticker)) return "bg-gray-50";
      if (ETF_GROUPS.GROUP_A.includes(ticker)) return "bg-green-50";
      if (ETF_GROUPS.GROUP_B.includes(ticker)) return "bg-yellow-50";
      if (ETF_GROUPS.GROUP_C.includes(ticker)) return "bg-blue-50";
      if (ETF_GROUPS.GROUP_D.includes(ticker)) return "bg-red-50";
      return "";
    };

    const groupColor = getGroupBackgroundColor(etf.ticker);
    const rowClassName = `${groupColor} ${
      isHeld ? "border-l-4 border-blue-500" : ""
    } transition-colors`;

    const currentPrice = prices[etf.ticker]?.price;
    console.log(`Rendering ${etf.ticker} with price:`, currentPrice);

    return (
      <TableRow key={etf.ticker} className={rowClassName}>
        <TableCell className="px-4 py-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{etf.ticker}</span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3">
          <span className="text-gray-900">
            {ETF_DATA[etf.ticker]?.name || ""}
          </span>
        </TableCell>
        <TableCell className="px-4 py-3 text-right">
          <div className="flex flex-col items-end">
            <span className="font-medium text-gray-900">
              {currentPrice ? formatCurrency(currentPrice) : "Loading..."}
            </span>
            {status[etf.ticker] && (
              <span className="text-sm text-gray-500">
                {status[etf.ticker]}
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-right">
          {isHeld && (
            <span className="font-medium text-gray-900">
              {portfolioEntry.totalShares.toLocaleString()}
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-right">
          {isHeld && (
            <span className="font-medium text-gray-900">
              {formatCurrency(currentPrice * portfolioEntry.totalShares)}
            </span>
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-right">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}
          >
            {status}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const updateGroupETFs = async (group) => {
    const etfsInGroup = Object.entries(ETF_DATA)
      .filter(([_, data]) => data.group === group)
      .map(([ticker]) => ticker);

    const totalETFs = etfsInGroup.length;
    setGroupProgress((prev) => ({
      ...prev,
      [group]: { current: 0, total: totalETFs, currentTicker: etfsInGroup[0] },
    }));

    for (let i = 0; i < etfsInGroup.length; i++) {
      const ticker = etfsInGroup[i];
      setGroupProgress((prev) => ({
        ...prev,
        [group]: {
          current: i,
          total: totalETFs,
          currentTicker: ticker,
        },
      }));
      await updateSingleETF(ticker);
      setGroupProgress((prev) => ({
        ...prev,
        [group]: {
          current: i + 1,
          total: totalETFs,
          currentTicker: i < totalETFs - 1 ? etfsInGroup[i + 1] : null,
        },
      }));
    }

    setStatus((prev) => ({ ...prev, [group]: "✅ Group updated!" }));
    setTimeout(() => {
      setStatus((prev) => ({ ...prev, [group]: null }));
      setGroupProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[group];
        return newProgress;
      });
    }, 3000);
  };

  const calculateTotal = () => {
    if (!etfs || !Array.isArray(etfs)) return 0;

    return etfs.reduce((total, etf) => {
      const currentPrice = prices[etf.ticker]?.price || 0;
      return total + currentPrice * (etf.totalShares || 0);
    }, 0);
  };

  const formatPrice = (price) => {
    return price ? `$${Number(price).toFixed(2)}` : "-";
  };

  const formatDate = (timestampData) => {
    console.log("formatDate received:", timestampData);
    if (!timestampData || !timestampData.seconds) {
      console.log("Invalid timestamp data");
      return "-";
    }

    try {
      // Convert the plain object to a Firestore Timestamp
      const timestamp = new Timestamp(
        timestampData.seconds,
        timestampData.nanoseconds
      );
      console.log("Created Timestamp:", timestamp);
      const date = timestamp.toDate();
      console.log("Converted to Date:", date);

      const formatted = date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      console.log("Formatted date:", formatted);
      return formatted;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  return (
    <div className="space-y-8 p-4">
      {window.location.hostname === "iamtommyzombie.github.io" && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                This is a demo version. To use price updates, please run the
                application locally.
                <a
                  href="https://github.com/IAmTommyZombie/InvestmentDashboard"
                  className="font-medium underline ml-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Portfolio Value
            </h2>
            <DollarSign className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(totalValue || 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Monthly Income
            </h2>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(monthlyIncome || 0)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Total Shares
            </h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {(totalShares || 0).toLocaleString("en-US")}
          </p>
        </div>
      </div>

      {Object.keys(groupedETFs)
        .sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b))
        .map((group) => (
          <div key={group} className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">{group}</h2>
              <div className="flex items-center gap-4">
                {groupProgress[group] && (
                  <div className="flex items-center gap-2">
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-200"
                        style={{
                          width: `${
                            (groupProgress[group].current /
                              groupProgress[group].total) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {groupProgress[group].currentTicker ? (
                        <>
                          Updating {groupProgress[group].currentTicker}
                          <span className="ml-2 text-gray-400">
                            ({groupProgress[group].current}/
                            {groupProgress[group].total})
                          </span>
                        </>
                      ) : (
                        `${groupProgress[group].current}/${groupProgress[group].total}`
                      )}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => updateGroupETFs(group)}
                  disabled={groupProgress[group]}
                  className={`px-3 py-1 rounded-md text-sm ${
                    groupProgress[group]
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {window.location.hostname === "iamtommyzombie.github.io"
                    ? "Demo Mode"
                    : groupProgress[group]
                    ? "Updating..."
                    : "Update Group"}
                </button>
              </div>
            </div>
            {status[group] && status[group].includes("✅") && (
              <p className="text-sm mb-2 text-gray-600">{status[group]}</p>
            )}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ETF Details</TableCell>
                      <TableCell>Frequency</TableCell>
                      <TableCell>Price Info</TableCell>
                      <TableCell>Latest Distribution</TableCell>
                      <TableCell>Annual Yield</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedETFs[group].map((etf) => renderETFRow(etf))}
                  </TableBody>
                </Table>
              </TableContainer>
            </div>
          </div>
        ))}
    </div>
  );
}
