import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import { usePortfolio } from "../../context/PortfolioContext";
import { useDistributions } from "../../context/DistributionContext";
import { PieChart, BarChart3, DollarSign } from "lucide-react";
import {
  ETF_DATA,
  STATUS_STYLES,
  GROUP_ORDER,
  getETFStatus,
} from "../../data/etfMetadata";

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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "prices"),
      (snapshot) => {
        const priceData = {};
        snapshot.forEach((doc) => {
          priceData[doc.id] = doc.data().currentPrice;
        });
        setPrices(priceData);
        setPricesLoading(false);
      },
      (error) => {
        console.error("Error fetching prices:", error);
        setPricesLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
        <td className="px-4 py-3 text-right">
          <div>
            <span className="font-medium">
              ${prices[etf.ticker]?.toFixed(2) || "TBD"}
            </span>
            <p className="text-xs text-gray-500">Inception: {etf.inception}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <span className={`font-medium ${statusStyles.text}`}>
            {getLatestDistribution(etf.ticker) === "TBD" ||
            getLatestDistribution(etf.ticker) === "N/A"
              ? getLatestDistribution(etf.ticker)
              : `$${getLatestDistribution(etf.ticker)}`}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
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
            $
            {(totalValue || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
            $
            {(monthlyIncome || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
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
    </div>
  );
};

export default DashboardGrid;
