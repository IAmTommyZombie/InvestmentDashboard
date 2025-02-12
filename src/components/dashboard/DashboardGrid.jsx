import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { usePortfolio } from "../../context/PortfolioContext";
import { useDistributions } from "../../context/DistributionContext";
import { PieChart, BarChart3, DollarSign } from "lucide-react";
import {
  ETF_DATA,
  STATUS_STYLES,
  GROUP_ORDER,
  getETFStatus,
} from "../../data/etfMetadata";
import { formatCurrency } from "../../utils/formatters";

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

const DashboardGrid = () => {
  const { etfs = [], totalValue = 0, totalShares = 0 } = usePortfolio() || {};
  const {
    getLatestDistribution,
    getPaymentsPerYear,
    distributions = {},
    loading,
  } = useDistributions() || {};
  const [prices, setPrices] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [updatingETFs, setUpdatingETFs] = useState({});
  const [status, setStatus] = useState({});
  const [lastUpdateTime, setLastUpdateTime] = useState({});
  const [priceChanges, setPriceChanges] = useState({});
  const [groupProgress, setGroupProgress] = useState({});

  useEffect(() => {
    console.log("Setting up price listener");
    const unsubscribe = onSnapshot(
      collection(db, "prices"),
      (snapshot) => {
        console.log("Received price update from Firestore");
        const newPrices = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`Price for ${data.ticker}:`, data.currentPrice);
          newPrices[data.ticker] = data.currentPrice;
        });
        console.log("Setting new prices:", newPrices);
        setPrices(newPrices);
        setPricesLoading(false);
      },
      (error) => {
        console.error("Error fetching prices:", error);
        setPricesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateSingleETF = async (ticker) => {
    if (!ticker) return;
    console.log(`Starting update for ${ticker}`);

    setUpdatingETFs((prev) => ({ ...prev, [ticker]: true }));
    setStatus((prev) => ({ ...prev, [ticker]: "⏳ Scraping price..." }));

    try {
      const response = await fetch("http://localhost:3000/scrape-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticker }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Server error details:", data);
        throw new Error(data.error || `Failed to scrape price for ${ticker}`);
      }

      console.log(`Received scraped data for ${ticker}:`, data);

      // Get the updated price from Firestore to verify
      const priceRef = doc(db, "prices", ticker);
      const priceDoc = await getDoc(priceRef);

      if (!priceDoc.exists()) {
        throw new Error(`No price data found for ${ticker}`);
      }

      const priceData = priceDoc.data();
      console.log(`Firestore data for ${ticker}:`, priceData);

      // Update local state with verification
      setPrices((prev) => {
        const newPrices = {
          ...prev,
          [ticker]: priceData.currentPrice,
        };
        console.log(`Updating prices state for ${ticker}:`, {
          oldPrice: prev[ticker],
          newPrice: priceData.currentPrice,
        });
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

    const price = prices[etf.ticker];
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
      currentPrice: prices[ticker] || "TBD",
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
      prices[etf.ticker],
      getLatestDistribution(etf.ticker)
    );
    const statusStyles = STATUS_STYLES[status];

    const portfolioEntry = etfs.find(
      (p) => p.ticker === etf.ticker && p.totalShares > 0
    );

    const isHeld = !!portfolioEntry;
    const heldStyles = isHeld
      ? "bg-blue-100 border-l-4 border-blue-500"
      : "hover:bg-gray-50";

    const currentPrice = prices[etf.ticker];
    console.log(`Rendering ${etf.ticker} with price:`, currentPrice);

    return (
      <tr key={etf.ticker} className={`${heldStyles} transition-colors`}>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <span className="font-medium text-gray-900">{etf.ticker}</span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-gray-900">
            {ETF_DATA[etf.ticker]?.name || ""}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
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
        </td>
        <td className="px-4 py-3 text-right">
          {isHeld && (
            <span className="font-medium text-gray-900">
              {portfolioEntry.totalShares.toLocaleString()}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          {isHeld && (
            <span className="font-medium text-gray-900">
              {formatCurrency(currentPrice * portfolioEntry.totalShares)}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles}`}
          >
            {status}
          </div>
        </td>
      </tr>
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
      const currentPrice = prices[etf.ticker] || 0;
      return total + currentPrice * (etf.totalShares || 0);
    }, 0);
  };

  return (
    <div className="space-y-8 p-4">
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
                  {groupProgress[group] ? "Updating..." : "Update Group"}
                </button>
              </div>
            </div>
            {status[group] && status[group].includes("✅") && (
              <p className="text-sm mb-2 text-gray-600">{status[group]}</p>
            )}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      ETF Details
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Price Info
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Latest Distribution
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                      Annual Yield
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groupedETFs[group].map((etf) => renderETFRow(etf))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold mb-2">Portfolio Total</h3>
        <p className="text-3xl font-semibold">
          {formatCurrency(calculateTotal())}
        </p>
      </div>
    </div>
  );
};

export default DashboardGrid;
