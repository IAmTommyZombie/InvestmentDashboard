import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  Timestamp,
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
import { UpdateButton } from "./UpdateButton";
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "prices"),
      (snapshot) => {
        const newPrices = { ...prices };

        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified" || change.type === "added") {
            const data = change.doc.data();
            newPrices[data.ticker] = data.currentPrice;

            // Calculate price change after we have the data
            const previousPrice =
              FALLBACK_PRICES[data.ticker]?.price || data.currentPrice;
            const priceChange =
              ((data.currentPrice - previousPrice) / previousPrice) * 100;

            setPriceChanges((prev) => ({
              ...prev,
              [data.ticker]: priceChange,
            }));
          }
        });

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

    setUpdatingETFs((prev) => ({ ...prev, [ticker]: true }));
    setStatus((prev) => ({ ...prev, [ticker]: "⏳ Updating..." }));

    try {
      // Simulate price update for now
      const mockPrice =
        FALLBACK_PRICES[ticker].price * (1 + Math.random() * 0.1 - 0.05);

      await setDoc(doc(db, "prices", ticker), {
        currentPrice: mockPrice,
        lastUpdated: Timestamp.now(),
        source: "mock",
        ticker: ticker,
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

    // Find if this ETF exists in Firebase portfolio
    const portfolioEntry = etfs.find(
      (p) => p.ticker === etf.ticker && p.totalShares > 0 // Use totalShares from Firebase instead of shares
    );

    const isHeld = !!portfolioEntry;

    const heldStyles = isHeld
      ? "bg-blue-100 border-l-4 border-blue-500"
      : "hover:bg-gray-50";

    const currentPrice = prices[etf.ticker] || "TBD";
    const priceChange = priceChanges[etf.ticker] || 0;
    const total = currentPrice * (etf?.shares || 0);

    return (
      <tr key={etf.ticker} className={`${heldStyles} transition-colors`}>
        <td className="px-4 py-3">
          <div className="flex items-center">
            <div>
              <span
                className={`font-medium ${
                  isHeld ? "text-blue-600" : "text-gray-900"
                }`}
              >
                {etf.ticker}
              </span>
              {isHeld && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {portfolioEntry.group || "In Portfolio"}
                </span>
              )}
              <p className="text-xs text-gray-500">{etf.name}</p>
              {isHeld && (
                <div className="text-xs">
                  <p className="text-blue-600 font-medium">
                    Holdings: {portfolioEntry.totalShares.toLocaleString()}{" "}
                    shares
                  </p>
                  {portfolioEntry.purchaseDate && (
                    <p className="text-gray-500">
                      Added:{" "}
                      {new Date(
                        portfolioEntry.purchaseDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles.bg} ${statusStyles.text}`}
          >
            {etf.frequency}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
          <div>
            <span className="font-medium">{formatCurrency(currentPrice)}</span>
            {priceChange !== 0 && (
              <span
                className={`text-sm ${
                  priceChange > 0
                    ? "text-green-600"
                    : priceChange < 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                {priceChange > 0 ? "↑" : "↓"}
                {Math.abs(priceChange).toFixed(2)}%
              </span>
            )}
            <p className="text-xs text-gray-500">Inception: {etf.inception}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
          <span className={`font-medium ${statusStyles.text}`}>
            {getLatestDistribution(etf.ticker) === "TBD" ||
            getLatestDistribution(etf.ticker) === "N/A"
              ? getLatestDistribution(etf.ticker)
              : `$${getLatestDistribution(etf.ticker)}`}
          </span>
        </td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
          <span
            className={`font-medium ${
              calculateAnnualYield(etf) !== "TBD" &&
              Number(calculateAnnualYield(etf)) > 15
                ? "text-green-600"
                : statusStyles.text
            }`}
          >
            {calculateAnnualYield(etf) === "TBD"
              ? "TBD"
              : `${calculateAnnualYield(etf)}%`}
          </span>
        </td>
      </tr>
    );
  };

  const calculateTotal = () => {
    return Object.entries(FALLBACK_PRICES).reduce((total, [ticker, data]) => {
      const currentPrice = prices[ticker] || data.price;
      const quantity = data.quantity || 0;
      return total + currentPrice * quantity;
    }, 0);
  };

  return (
    <div className="space-y-8 p-4">
      <div className="mb-4">
        <UpdateButton />
      </div>
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

      {GROUP_ORDER.map((groupName) => (
        <div key={groupName} className="rounded-lg overflow-hidden shadow-lg">
          <div
            className={`flex justify-between items-center p-4 ${STATUS_STYLES.active.bg} ${STATUS_STYLES.active.text}`}
          >
            <h2 className="text-xl font-bold">{groupName.replace("_", " ")}</h2>
            <div className="text-sm font-medium">
              Next Distribution:{" "}
              {getNextDistributionDate(groupedETFs[groupName]?.[0]?.frequency)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
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
                {groupedETFs[groupName]?.map(renderETFRow)}
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
