import React, { useState, useEffect, useMemo } from "react";
import { Trash2, Plus, Calendar, Edit, X } from "lucide-react";
import { getDistribution } from "../../data/distributions";
import { db } from "../../firebase/config";
import {
  collection,
  onSnapshot,
  query,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import AddETFForm from "./AddETFForm";
import { useDistribution } from "../../context/DistributionContext";
import { usePortfolio } from "../../context/PortfolioContext";
import { useDistribution as useDistributionContext } from "../../context/DistributionContext";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { formatCurrency } from "../../utils/formatters";
import {
  getPrices,
  getDistributions,
  deleteEtf,
} from "../../services/dynamoService";

// Define ETF groups
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
  GROUP_A: "Group A - Tech Leaders",
  GROUP_B: "Group B - Growth Companies",
  GROUP_C: "Group C - Consumer Brands",
  GROUP_D: "Group D - Market Innovators",
};

const getGroupStyle = (group) => {
  switch (group) {
    case "WEEKLY":
      return "bg-gray-200";
    case "GROUP_A":
      return "bg-green-50";
    case "GROUP_B":
      return "bg-yellow-50";
    case "GROUP_C":
      return "bg-blue-50";
    case "GROUP_D":
      return "bg-red-50";
    default:
      return "";
  }
};

const formatGroupName = (group) => {
  if (group === "WEEKLY") return "W";
  return group.slice(-1); // Extract just the last character for groups (A, B, C, D)
};

const getNextDistributionDate = (group) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  switch (group) {
    case "WEEKLY":
      // Next Friday
      const nextFriday = new Date();
      nextFriday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
      if (today.getDay() === 5 && today.getHours() >= 16) {
        nextFriday.setDate(nextFriday.getDate() + 7);
      }
      return nextFriday;

    case "GROUP_A":
      let seriesADate = new Date(currentYear, currentMonth, 21);
      if (currentDate > 21) {
        seriesADate = new Date(currentYear, currentMonth + 1, 21);
      }
      return seriesADate;

    case "GROUP_B":
      let seriesBDate = new Date(currentYear, currentMonth, 28);
      if (currentDate > 28) {
        seriesBDate = new Date(currentYear, currentMonth + 1, 28);
      }
      return seriesBDate;

    case "GROUP_C":
      let seriesCDate = new Date(currentYear, currentMonth, 7);
      if (currentDate > 7) {
        seriesCDate = new Date(currentYear, currentMonth + 1, 7);
      }
      return seriesCDate;

    case "GROUP_D":
      let seriesDDate = new Date(currentYear, currentMonth, 14);
      if (currentDate > 14) {
        seriesDDate = new Date(currentYear, currentMonth + 1, 14);
      }
      return seriesDDate;

    default:
      return new Date();
  }
};

const PortfolioView = () => {
  const { etfs, loading: etfsLoading } = usePortfolio();
  const [prices, setPrices] = useState({});
  const [distributions, setDistributions] = useState({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: "ticker",
    direction: "asc",
  });
  const [selectedEtf, setSelectedEtf] = useState(null);

  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    console.log("Setting up data listeners");
    setPricesLoading(true);

    // Function to load prices
    const loadPrices = async () => {
      try {
        const priceData = await getPrices();
        console.log("Final price data:", priceData);
        setPrices(priceData);
      } catch (error) {
        console.error("Error loading prices:", error);
      } finally {
        setPricesLoading(false);
      }
    };

    // Function to load distributions
    const loadDistributions = async () => {
      try {
        const distData = await getDistributions();
        setDistributions(distData);
      } catch (error) {
        console.error("Error loading distributions:", error);
      }
    };

    // Initial load
    loadPrices();
    loadDistributions();

    // Set up polling for updates (since DynamoDB doesn't have real-time listeners)
    const priceInterval = setInterval(loadPrices, 60000); // Poll every minute
    const distInterval = setInterval(loadDistributions, 60000);

    return () => {
      clearInterval(priceInterval);
      clearInterval(distInterval);
    };
  }, []);

  const getEtfGroup = (ticker) => {
    for (const [group, etfs] of Object.entries(ETF_GROUPS)) {
      if (etfs.includes(ticker)) {
        return group;
      }
    }
    return "UNKNOWN";
  };

  const getGroupColor = (group) => {
    switch (group) {
      case "WEEKLY":
        return "bg-purple-100 border-purple-200";
      case "GROUP_A":
        return "bg-blue-100 border-blue-200";
      case "GROUP_B":
        return "bg-green-100 border-green-200";
      case "GROUP_C":
        return "bg-yellow-100 border-yellow-200";
      case "GROUP_D":
        return "bg-red-100 border-red-200";
      default:
        return "bg-gray-100 border-gray-200";
    }
  };

  const sortEtfs = (etfs) => {
    if (!sortConfig.key) return etfs;

    return [...etfs].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "ticker":
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case "shares":
          aValue = a.totalShares || 0;
          bValue = b.totalShares || 0;
          break;
        case "price":
          aValue = prices[a.ticker]?.currentPrice || 0;
          bValue = prices[b.ticker]?.currentPrice || 0;
          break;
        case "value":
          aValue = (prices[a.ticker]?.currentPrice || 0) * (a.totalShares || 0);
          bValue = (prices[b.ticker]?.currentPrice || 0) * (b.totalShares || 0);
          break;
        case "income":
          aValue = (a.distribution || 0) * (a.totalShares || 0);
          bValue = (b.distribution || 0) * (b.totalShares || 0);
          break;
        default:
          return 0;
      }

      const direction = sortConfig.direction === "asc" ? 1 : -1;
      return aValue > bValue ? direction : -direction;
    });
  };

  const handleSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const groupEtfsByMonth = () => {
    if (!etfs || !Array.isArray(etfs)) return {};

    const portfolioEtfs = etfs.filter(
      (etf) => etf.totalShares && etf.totalShares > 0 && etf.ticker
    );

    const groups = portfolioEtfs.reduce((acc, etf) => {
      const month = etf.purchaseDate
        ? parseInt(etf.purchaseDate.split("-")[1]) - 1
        : 0;

      if (!acc[month]) {
        acc[month] = [];
      }

      // Check if this ETF already exists in this month
      const existingEtfIndex = acc[month].findIndex(
        (e) => e.ticker === etf.ticker
      );

      if (existingEtfIndex >= 0) {
        // Combine with existing entry
        const existingEtf = acc[month][existingEtfIndex];
        acc[month][existingEtfIndex] = {
          ...existingEtf,
          totalShares: (existingEtf.totalShares || 0) + (etf.totalShares || 0),
          // Combine purchases arrays if they exist
          purchases: [
            ...(existingEtf.purchases || []),
            ...(etf.purchases || []),
          ],
          // Keep the earliest purchase date
          purchaseDate:
            existingEtf.purchaseDate < etf.purchaseDate
              ? existingEtf.purchaseDate
              : etf.purchaseDate,
        };
      } else {
        // Add new entry
        acc[month].push(etf);
      }

      return acc;
    }, {});

    console.log("Grouped ETFs:", groups);
    return groups;
  };

  const monthlyGroups = useMemo(() => groupEtfsByMonth(), [etfs]);

  // Function to get current distribution for an ETF
  const getCurrentDistribution = (ticker) => {
    const distHistory = distributions[ticker]?.history;
    if (!distHistory) return 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Try to get the most recent distribution
    for (let year = currentYear; year >= currentYear - 1; year--) {
      const yearData = distHistory[year];
      if (yearData) {
        for (let month = currentMonth; month >= 1; month--) {
          const amount = yearData[month];
          if (amount && amount !== "TBD") {
            return parseFloat(amount);
          }
        }
      }
    }
    return 0;
  };

  // Calculate totals using current distributions
  const calculateTotals = () => {
    let totalValue = 0;
    let totalMonthlyIncome = 0;
    const months = Object.keys(monthlyGroups).sort(); // Sort months chronologically

    months.forEach((currentMonth) => {
      let monthValue = 0;
      let monthIncome = 0;

      // Calculate for all months up to and including current month
      months.forEach((month) => {
        if (month <= currentMonth) {
          monthlyGroups[month].forEach((etf) => {
            const price = prices[etf.ticker]?.currentPrice || 0;
            const shares = etf.totalShares || 0;
            const value = price * shares;
            const distribution = getCurrentDistribution(etf.ticker);
            const monthlyIncome = distribution * shares;

            monthValue += value;
            monthIncome += monthlyIncome;

            console.log(`Calculating for ${month} ETF:`, {
              ticker: etf.ticker,
              price,
              shares,
              value,
              distribution,
              monthlyIncome,
            });
          });
        }
      });

      // Store the progressive totals for each month
      monthlyGroups[currentMonth].totalValue = monthValue;
      monthlyGroups[currentMonth].totalMonthlyIncome = monthIncome;
      monthlyGroups[currentMonth].annualYield = monthValue
        ? ((monthIncome * 12) / monthValue) * 100
        : 0;

      // Update running totals
      totalValue = monthValue;
      totalMonthlyIncome = monthIncome;
    });

    return {
      totalValue,
      totalMonthlyIncome,
      annualYield: totalValue
        ? ((totalMonthlyIncome * 12) / totalValue) * 100
        : 0,
    };
  };

  const totals = calculateTotals();

  // Show loading state if either ETFs or prices are still loading
  if (etfsLoading || pricesLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-gray-500">Loading portfolio data...</div>
        </div>
      </div>
    );
  }

  if (!etfs || etfs.length === 0) {
    return <div>No ETFs found in portfolio</div>;
  }

  // Purchase History Modal
  const PurchaseHistoryModal = ({ etf, onClose }) => {
    if (!etf) return null;

    const currentPrice = prices[etf.ticker]?.currentPrice || 0;

    // Calculate total amount paid
    const totalPaid = etf.purchases?.reduce((sum, purchase) => {
      const price = parseFloat(purchase.price) || 0;
      const shares = parseInt(purchase.shares) || 0;
      return sum + price * shares;
    }, 0);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">
              {etf.ticker} Purchase History
              <span className="ml-2 text-sm text-gray-500">
                (Current Price: {formatCurrency(currentPrice)})
              </span>
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price Paid
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {etf.purchases?.map((purchase, index) => {
                const purchaseShares = parseInt(purchase.shares) || 0;
                const purchasePrice = parseFloat(purchase.price) || 0;
                const purchaseTotal = purchaseShares * purchasePrice;
                const currentValue = purchaseShares * currentPrice;

                return (
                  <tr key={index}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {purchase.date}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {purchaseShares.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {purchasePrice > 0
                        ? formatCurrency(purchasePrice)
                        : "Not recorded"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {purchasePrice > 0
                        ? formatCurrency(purchaseTotal)
                        : "Not recorded"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div>{formatCurrency(currentValue)}</div>
                      <div className="text-sm text-gray-500">
                        at current price
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2">Totals</td>
                <td className="px-4 py-2 text-right">
                  {etf.totalShares?.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-right">-</td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(totalPaid)}
                </td>
                <td className="px-4 py-2 text-right">
                  {formatCurrency(etf.totalShares * currentPrice)}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 text-sm text-gray-500">
            Note: Historical purchase prices are not recorded for some entries.
            Only current market values are shown.
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteETF = async (etfId) => {
    if (!window.confirm("Are you sure you want to delete this ETF?")) {
      return;
    }

    try {
      await deleteEtf(etfId);
      if (selectedEtf?.id === etfId) {
        setSelectedEtf(null);
      }
    } catch (error) {
      console.error("Error deleting ETF:", error);
      alert("Error deleting ETF");
    }
  };

  const renderTableRow = (etf) => {
    const currentPrice = prices[etf.ticker]?.currentPrice || 0;
    const currentValue = currentPrice * etf.totalShares;
    const distribution = getCurrentDistribution(etf.ticker);
    const monthlyIncome = distribution * etf.totalShares;

    const monthsToBreakEven =
      monthlyIncome > 0 ? Math.ceil(currentValue / monthlyIncome) : Infinity;

    const yearsToBreakEven = Math.floor(monthsToBreakEven / 12);
    const remainingMonths = monthsToBreakEven % 12;
    const breakEvenDisplay =
      monthlyIncome > 0 ? `${yearsToBreakEven}y ${remainingMonths}m` : "N/A";

    // Get group and corresponding background color
    const getGroupColor = (ticker) => {
      if (ETF_GROUPS.WEEKLY.includes(ticker))
        return "bg-gray-100 hover:bg-gray-200";
      if (ETF_GROUPS.GROUP_A.includes(ticker))
        return "bg-green-50 hover:bg-green-100";
      if (ETF_GROUPS.GROUP_B.includes(ticker))
        return "bg-yellow-50 hover:bg-yellow-100";
      if (ETF_GROUPS.GROUP_C.includes(ticker))
        return "bg-blue-50 hover:bg-blue-100";
      if (ETF_GROUPS.GROUP_D.includes(ticker))
        return "bg-red-50 hover:bg-red-100";
      return "";
    };

    return (
      <tr key={etf.ticker} className={`${getGroupColor(etf.ticker)}`}>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {etf.ticker}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {etf.totalShares.toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatCurrency(currentPrice)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatCurrency(currentValue)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatCurrency(distribution)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {formatCurrency(monthlyIncome)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {breakEvenDisplay}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 space-x-2">
          <button
            onClick={() => setSelectedEtf({ ...etf, id: etf.id })}
            className="text-blue-600 hover:text-blue-800 mr-2"
          >
            <Edit className="w-4 h-4 inline" />
          </button>
          <button
            onClick={() => handleDeleteETF(etf.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4 inline" />
          </button>
        </td>
      </tr>
    );
  };

  // Update the table header to include Actions column
  const renderTableHeader = () => (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Ticker
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Shares
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Current Price
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Value
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Distribution
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Monthly Income
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Break Even
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Total Portfolio Value
          </h2>
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(totals.totalValue)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Based on current prices</p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Monthly Income
          </h2>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(totals.totalMonthlyIncome)}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Total monthly distributions
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-600 mb-2">
            Annual Yield
          </h2>
          <p className="text-3xl font-bold text-purple-600">
            {totals.annualYield.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Based on current value</p>
        </div>
      </div>

      {/* Monthly Tables */}
      {Object.entries(monthlyGroups)
        .sort()
        .map(([month, monthEtfs]) => {
          // Get all ETFs from current and previous months
          const cumulativeEtfs = Object.entries(monthlyGroups)
            .filter(([m]) => m <= month)
            .reduce((acc, [_, etfs]) => {
              etfs.forEach((etf) => {
                const existingEtf = acc.find((e) => e.ticker === etf.ticker);
                if (existingEtf) {
                  // Update existing ETF
                  existingEtf.totalShares =
                    (existingEtf.totalShares || 0) + (etf.totalShares || 0);
                  existingEtf.purchases = [
                    ...(existingEtf.purchases || []),
                    ...(etf.purchases || []),
                  ];
                } else {
                  // Add new ETF
                  acc.push({ ...etf });
                }
              });
              return acc;
            }, []);

          // Calculate cumulative totals
          const cumulativeTotals = cumulativeEtfs.reduce(
            (acc, etf) => {
              const currentPrice = prices[etf.ticker]?.currentPrice || 0;
              const shares = etf.totalShares || 0;
              const value = currentPrice * shares;
              const distribution = getCurrentDistribution(etf.ticker);
              const monthlyIncome = distribution * shares;

              acc.value += value;
              acc.monthlyIncome += monthlyIncome;
              return acc;
            },
            { value: 0, monthlyIncome: 0 }
          );

          // Calculate this month's individual totals
          const monthTotals = monthEtfs.reduce(
            (acc, etf) => {
              const currentPrice = prices[etf.ticker]?.currentPrice || 0;
              const shares = etf.totalShares || 0;
              const value = currentPrice * shares;
              const distribution = getCurrentDistribution(etf.ticker);
              const monthlyIncome = distribution * shares;

              acc.value += value;
              acc.monthlyIncome += monthlyIncome;
              return acc;
            },
            { value: 0, monthlyIncome: 0 }
          );

          return (
            <div key={month} className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                {MONTHS[parseInt(month)]}
              </h3>
              <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    {renderTableHeader()}
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortEtfs(cumulativeEtfs).map(renderTableRow)}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {MONTHS[parseInt(month)]} Totals
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cumulativeTotals.value)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(cumulativeTotals.monthlyIncome)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}

      {/* Purchase History Modal */}
      {selectedEtf && (
        <PurchaseHistoryModal
          etf={selectedEtf}
          onClose={() => setSelectedEtf(null)}
        />
      )}
    </div>
  );
};

export default PortfolioView;
