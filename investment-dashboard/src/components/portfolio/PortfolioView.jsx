import React, { useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { ArrowUp, ArrowDown, Plus, Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogClose,
  DialogTitle,
} from "../ui/dialog";
import AddETFForm from "./AddETFForm";

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
  if (group === "WEEKLY") {
    return "W";
  }
  // Extract just the last character for groups (A, B, C, D)
  return group.slice(-1);
};

const PortfolioView = () => {
  const {
    etfs,
    stats,
    updateETF,
    deleteETF,
    addPurchase,
    getETFDetails,
    getDividendAmount,
  } = usePortfolio();
  const [sortBy, setSortBy] = useState("value_desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [editEtf, setEditEtf] = useState(null);
  const [showAddPurchase, setShowAddPurchase] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    shares: "",
    price: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const filteredEtfs = etfs.filter((etf) =>
    etf.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateHoldingPeriod = (purchaseDate) => {
    const start = new Date(purchaseDate);
    const today = new Date();
    const months =
      (today.getFullYear() - start.getFullYear()) * 12 +
      (today.getMonth() - start.getMonth());
    const days = Math.floor((today - start) / (1000 * 60 * 60 * 24)) % 30;

    if (months < 1) {
      return `${days} days`;
    } else if (months < 12) {
      return `${months} months, ${days} days`;
    } else {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      return `${years}y ${remainingMonths}m ${days}d`;
    }
  };

  const calculateMonthlyIncome = (etf) => {
    const currentMonth = new Date(selectedYear, selectedMonth).toLocaleString(
      "default",
      { month: "short" }
    );
    const monthlyAmount = getDividendAmount(etf.ticker, currentMonth);
    return monthlyAmount * etf.shares;
  };

  const calculateTotalDividends = (etf) => {
    const purchaseDate = new Date(etf.purchaseDate);
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (today.getMonth() - purchaseDate.getMonth());

    return Math.max(0, monthsDiff) * (etf.distribution || 0) * etf.shares;
  };

  const calculateTotalValue = (etf) => {
    return etf.shares * etf.currentPrice;
  };

  const calculateCostBasisAverage = (etf) => {
    console.log("Calculating cost basis for ETF:", etf);

    if (!etf.purchases || etf.purchases.length === 0) {
      console.log(
        "No purchases found, using legacy cost basis:",
        etf.costBasis
      );
      return Number(etf.costBasis) || 0;
    }

    let totalCost = 0;
    let totalShares = 0;

    etf.purchases.forEach((purchase) => {
      const shares = Number(purchase.shares);
      const price = Number(purchase.price);
      if (!isNaN(shares) && !isNaN(price)) {
        totalShares += shares;
        totalCost += shares * price;
      }
    });

    console.log("Calculated totals:", { totalCost, totalShares });

    if (totalShares === 0) return 0;
    const average = totalCost / totalShares;
    console.log("Final cost basis average:", average);
    return average;
  };

  const handleAddPurchase = async () => {
    if (editEtf && newPurchase.shares && newPurchase.price) {
      try {
        console.log("Adding purchase:", {
          etfId: editEtf._id,
          purchase: {
            date: newPurchase.date,
            shares: Number(newPurchase.shares),
            price: Number(newPurchase.price),
          },
        });

        await addPurchase(editEtf._id, {
          date: newPurchase.date,
          shares: Number(newPurchase.shares),
          price: Number(newPurchase.price),
        });

        // Reset form
        setShowAddPurchase(false);
        setEditEtf(null);
        setNewPurchase({
          shares: "",
          price: "",
          date: new Date().toISOString().split("T")[0],
        });
      } catch (error) {
        console.error("Failed to add purchase:", error);
        alert("Failed to add purchase. Please try again.");
      }
    }
  };

  const handleDelete = async (ticker) => {
    if (
      window.confirm(
        `Are you sure you want to delete all holdings of ${ticker}?`
      )
    ) {
      try {
        // Get all ETF entries with this ticker
        const etfEntries = filteredEtfs.filter((etf) => etf.ticker === ticker);

        // Delete each ETF entry one by one using their IDs
        for (const etf of etfEntries) {
          await deleteETF(etf._id); // Using _id instead of ticker
        }

        showSuccessMessage(`All ${ticker} holdings deleted successfully`);
      } catch (error) {
        console.error("Error deleting ETF:", error);
      }
    }
  };

  // Helper function to get next dividend date and amount
  const getNextDividend = (etf) => {
    const today = new Date();
    const nextDate = new Date(etf.nextDividendDate); // Assuming you have this data
    const amount = etf.expectedDividend; // Assuming you have this data
    return {
      date: nextDate.toLocaleDateString(),
      amount: amount ? `$${amount.toFixed(2)}` : "N/A",
    };
  };

  // Helper function to get all ETF holdings up to a specific date
  const getHoldingsUpToDate = (etfs, targetDate) => {
    // Group by ticker and accumulate shares
    const holdings = etfs.reduce((acc, etf) => {
      const purchaseDate = new Date(etf.purchaseDate);

      // Only include ETFs purchased on or before the target date
      if (purchaseDate <= targetDate) {
        const ticker = etf.ticker;
        if (!acc[ticker]) {
          acc[ticker] = {
            ...etf,
            totalShares: 0,
            newShares: 0,
          };
        }

        // Add to total shares
        acc[ticker].totalShares += Number(etf.shares);

        // If purchased in the target month/year, set as new shares
        if (
          purchaseDate.getMonth() === targetDate.getMonth() &&
          purchaseDate.getFullYear() === targetDate.getFullYear()
        ) {
          acc[ticker].newShares = Number(etf.shares);
        }
      }
      return acc;
    }, {});

    return Object.values(holdings);
  };

  // Modified groupEtfsByMonth to use the new holdings calculation
  const groupEtfsByMonth = () => {
    const months = Array(12)
      .fill()
      .map((_, i) => i);

    return months
      .map((month) => {
        const targetDate = new Date(selectedYear, month, 31); // End of month
        const monthlyHoldings = getHoldingsUpToDate(filteredEtfs, targetDate);

        // Only include months that have any holdings
        if (monthlyHoldings.length === 0) return null;

        return {
          month: new Date(selectedYear, month).toLocaleString("default", {
            month: "long",
          }),
          etfs: monthlyHoldings,
        };
      })
      .filter(Boolean); // Remove null entries
  };

  const monthlyGroups = groupEtfsByMonth();

  // Modified getUniqueETFs to include group information
  const getUniqueETFs = () => {
    const uniqueETFs = new Map();

    filteredEtfs.forEach((etf) => {
      if (!uniqueETFs.has(etf.ticker)) {
        const { group, nextDividend } = getETFDetails(etf.ticker);
        uniqueETFs.set(etf.ticker, {
          _id: etf._id,
          ticker: etf.ticker,
          group,
          nextDividendDate: nextDividend
            ? `${nextDividend.month} ${selectedYear}`
            : "N/A",
          nextDividendAmount: nextDividend ? nextDividend.amount : 0,
          totalShares:
            getHoldingsUpToDate(filteredEtfs, new Date()).find(
              (h) => h.ticker === etf.ticker
            )?.totalShares || 0,
        });
      }
    });

    return Array.from(uniqueETFs.values());
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Assets
          </h3>
          <p className="text-2xl font-semibold">
            ${stats.totalValue.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Monthly Income
          </h3>
          <p className="text-2xl font-semibold">
            ${stats.monthlyIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Average Yield
          </h3>
          <p className="text-2xl font-semibold">
            {stats.yieldRate.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ETF
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Dividend
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueETFs().map((etf) => (
                <tr key={etf._id} className={getGroupStyle(etf.group)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {etf.ticker}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatGroupName(etf.group)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {etf.totalShares}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {etf.nextDividendDate} (${etf.nextDividendAmount})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(etf.ticker)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete ETF"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {monthlyGroups.map(({ month, etfs }) => (
        <div key={month} className="bg-white rounded-lg shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">
              {month} {selectedYear}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Group
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    New Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Income
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {etfs.map((etf) => {
                  const { group } = getETFDetails(etf.ticker);
                  const monthlyIncome = calculateMonthlyIncome(etf);

                  return (
                    <tr key={etf._id} className={getGroupStyle(group)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {etf.ticker}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatGroupName(group)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {etf.newShares}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {etf.totalShares}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          ${monthlyIncome.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PortfolioView;
