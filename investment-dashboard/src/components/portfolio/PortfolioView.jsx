import React, { useState, useEffect, useCallback } from "react";
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
import { DISTRIBUTIONS } from "../../data/distributions";
import axios from "axios";
import {
  getDistribution,
  getFrequencyMultiplier,
} from "../../data/distributions";

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
      // If today is Friday and we've passed distribution time, move to next week
      if (today.getDay() === 5 && today.getHours() >= 16) {
        nextFriday.setDate(nextFriday.getDate() + 7);
      }
      return nextFriday;

    case "GROUP_A":
      // 21st of each month
      let seriesADate = new Date(currentYear, currentMonth, 21);
      if (currentDate > 21) {
        seriesADate = new Date(currentYear, currentMonth + 1, 21);
      }
      return seriesADate;

    case "GROUP_B":
      // 28th of each month
      let seriesBDate = new Date(currentYear, currentMonth, 28);
      if (currentDate > 28) {
        seriesBDate = new Date(currentYear, currentMonth + 1, 28);
      }
      return seriesBDate;

    case "GROUP_C":
      // 7th of each month
      let seriesCDate = new Date(currentYear, currentMonth, 7);
      if (currentDate > 7) {
        seriesCDate = new Date(currentYear, currentMonth + 1, 7);
      }
      return seriesCDate;

    case "GROUP_D":
      // 14th of each month
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
  const [prices, setPrices] = useState({});
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  const filteredEtfs = etfs.filter((etf) =>
    etf.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add useEffect to fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3500/api/prices/latest"
        );
        const priceData = response.data.reduce((acc, item) => {
          acc[item.ticker] = item.price;
          return acc;
        }, {});
        setPrices(priceData);
      } catch (error) {
        console.error("Error fetching prices:", error);
      }
    };

    fetchPrices();
  }, []);

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

  const getMonthlyDistribution = (ticker, year, month) => {
    // Try to get current month's distribution
    const currentDist = getDistribution(ticker, year, month);

    // If current month is not available, try previous month
    if (!currentDist || currentDist === 0) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const prevDist = getDistribution(ticker, prevYear, prevMonth);
      if (!prevDist || prevDist === 0) {
        return "TBD";
      }
      return prevDist;
    }

    return currentDist;
  };

  const calculateMonthlyIncome = (etf, year, month) => {
    const { group } = getETFDetails(etf.ticker);
    const distribution = getMonthlyDistribution(
      etf.ticker.toUpperCase(),
      year,
      month
    );

    if (distribution === "TBD") {
      return "TBD";
    }

    const shares = Number(etf.totalShares);
    let multiplier = 1;

    if (["YMAG", "YMAX", "LFGY", "GPTY"].includes(etf.ticker.toUpperCase())) {
      multiplier = 52 / 12;
    } else if (group.startsWith("GROUP_")) {
      multiplier = 13 / 12;
    }

    return distribution * shares * multiplier;
  };

  const calculateTotalDividends = (etf) => {
    const purchaseDate = new Date(etf.purchaseDate);
    const today = new Date();
    const monthsDiff =
      (today.getFullYear() - purchaseDate.getFullYear()) * 12 +
      (today.getMonth() - purchaseDate.getMonth());

    return Math.max(0, monthsDiff) * (etf.distribution || 0) * etf.shares;
  };

  const calculateTotalValue = (etfs) => {
    return etfs.reduce((total, etf) => {
      const value = etf.totalShares * (prices[etf.ticker.toUpperCase()] || 0);
      return total + value;
    }, 0);
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
      const ticker = etf.ticker;
      if (!uniqueETFs.has(ticker)) {
        const { group } = getETFDetails(ticker);

        // Calculate total shares for this ticker
        const totalShares = filteredEtfs
          .filter((e) => e.ticker === ticker)
          .reduce((sum, e) => sum + Number(e.shares), 0);

        // Default purchase date if none exists
        const defaultPurchaseDate = "2025-01-01";

        uniqueETFs.set(ticker, {
          _id: etf._id,
          ticker: ticker,
          group,
          totalShares: totalShares,
          currentPrice: prices[ticker.toUpperCase()],
          nextDividendAmount:
            getDistribution(
              ticker.toUpperCase(),
              selectedYear,
              selectedMonth
            ) || 0,
          purchaseDate: etf.purchaseDate || defaultPurchaseDate, // Add default purchase date
          purchases: etf.purchases || [
            {
              date: defaultPurchaseDate,
              shares: totalShares,
              price: prices[ticker.toUpperCase()] || 0,
            },
          ],
        });
      }
    });

    return Array.from(uniqueETFs.values());
  };

  const sortData = useCallback(
    (etfs, key, monthNum) => {
      return [...etfs].sort((a, b) => {
        let aValue, bValue;

        switch (key) {
          case "group":
            aValue = getETFDetails(a.ticker).group;
            bValue = getETFDetails(b.ticker).group;
            break;
          case "shares":
            aValue = Number(a.totalShares);
            bValue = Number(b.totalShares);
            break;
          case "value":
            aValue = a.totalShares * prices[a.ticker.toUpperCase()] || 0;
            bValue = b.totalShares * prices[b.ticker.toUpperCase()] || 0;
            break;
          case "monthlyIncome":
            const aIncome = calculateMonthlyIncome(a, selectedYear, monthNum);
            const bIncome = calculateMonthlyIncome(b, selectedYear, monthNum);
            aValue = aIncome === "TBD" ? -1 : aIncome;
            bValue = bIncome === "TBD" ? -1 : bIncome;
            break;
          default:
            return 0;
        }

        if (sortConfig.direction === "asc") {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    },
    [sortConfig.direction, selectedYear, prices]
  );

  const handleSort = useCallback((key, monthNum) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  }, []);

  const getSortIcon = useCallback(
    (key) => {
      if (sortConfig.key !== key) return "↕️";
      return sortConfig.direction === "asc" ? "↑" : "↓";
    },
    [sortConfig.key, sortConfig.direction]
  );

  const calculateBreakEven = (etf) => {
    console.log("===================");
    console.log(`DEBUG: Calculating break-even for ${etf.ticker}`);
    console.log("ETF Data:", etf);

    const currentPrice = prices[etf.ticker.toUpperCase()];
    const totalValue = etf.totalShares * currentPrice;
    console.log("Current Price:", currentPrice);
    console.log("Total Value:", totalValue);

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    console.log("Current Date:", `${currentYear}-${currentMonth}`);

    // Use new frequency multiplier helper
    const multiplier = getFrequencyMultiplier(etf.ticker.toUpperCase());
    console.log("Distribution multiplier:", multiplier);

    // Debug: Check what distributions are available
    console.log(
      "Available distributions for ticker:",
      DISTRIBUTIONS[etf.ticker.toUpperCase()]
    );

    // Get latest valid distribution
    let latestDistribution = null;
    for (let year = currentYear; year >= 2024; year--) {
      for (
        let month = year === currentYear ? currentMonth : 12;
        month >= 1;
        month--
      ) {
        const dist = getDistribution(etf.ticker.toUpperCase(), year, month);
        console.log(`Checking distribution for ${year}-${month}:`, dist);
        if (dist && dist !== "TBD" && typeof dist === "number") {
          latestDistribution = dist;
          break;
        }
      }
      if (latestDistribution) break;
    }

    console.log("Latest valid distribution:", latestDistribution);

    if (!latestDistribution) {
      console.log("No valid distribution found, returning TBD");
      return "TBD";
    }

    let totalDistributionsReceived = 0;

    // Debug the purchase data structure
    console.log("\nPurchase Data Check:");
    console.log("Has purchases array:", Boolean(etf.purchases));
    console.log("Purchases:", etf.purchases);
    console.log("Has purchaseDate:", Boolean(etf.purchaseDate));
    console.log("Purchase Date:", etf.purchaseDate);

    if (etf.purchases && etf.purchases.length > 0) {
      console.log("\nProcessing multiple purchases:", etf.purchases);

      etf.purchases.forEach((purchase, index) => {
        const purchaseDate = new Date(purchase.date);
        let purchaseYear = purchaseDate.getFullYear();
        let purchaseMonth = purchaseDate.getMonth() + 1;

        console.log(`\nProcessing purchase #${index + 1}:`);
        console.log("Purchase date:", `${purchaseYear}-${purchaseMonth}`);
        console.log("Shares:", purchase.shares);

        // Calculate months between purchase date and today
        const monthDiff =
          (currentYear - purchaseYear) * 12 + (currentMonth - purchaseMonth);
        console.log(`Months since purchase: ${monthDiff}`);

        // For each month since purchase
        for (let i = 0; i <= monthDiff; i++) {
          const calcMonth = ((purchaseMonth - 1 + i) % 12) + 1;
          const calcYear =
            purchaseYear + Math.floor((purchaseMonth - 1 + i) / 12);

          const dist = getDistribution(
            etf.ticker.toUpperCase(),
            calcYear,
            calcMonth
          );
          console.log(
            `Month ${i}: Checking ${calcYear}-${calcMonth}, distribution: ${dist}`
          );

          if (dist && dist !== "TBD" && typeof dist === "number") {
            const monthlyDist = dist * purchase.shares * multiplier;
            totalDistributionsReceived += monthlyDist;
            console.log(
              `Adding distribution: $${monthlyDist.toFixed(2)} (${dist} * ${
                purchase.shares
              } * ${multiplier})`
            );
          } else {
            console.log(
              `Skipping ${calcYear}-${calcMonth}: Invalid distribution value`
            );
          }
        }
      });
    } else if (etf.purchaseDate) {
      console.log("\nProcessing single purchase date:", etf.purchaseDate);
      const purchaseDate = new Date(etf.purchaseDate);
      let purchaseYear = purchaseDate.getFullYear();
      let purchaseMonth = purchaseDate.getMonth() + 1;

      // Calculate months between purchase date and today
      const monthDiff =
        (currentYear - purchaseYear) * 12 + (currentMonth - purchaseMonth);
      console.log(`Months since purchase: ${monthDiff}`);

      // For each month since purchase
      for (let i = 0; i <= monthDiff; i++) {
        const calcMonth = ((purchaseMonth - 1 + i) % 12) + 1;
        const calcYear =
          purchaseYear + Math.floor((purchaseMonth - 1 + i) / 12);

        const dist = getDistribution(
          etf.ticker.toUpperCase(),
          calcYear,
          calcMonth
        );
        console.log(
          `Month ${i}: Checking ${calcYear}-${calcMonth}, distribution: ${dist}`
        );

        if (dist && dist !== "TBD" && typeof dist === "number") {
          const monthlyDist = dist * etf.totalShares * multiplier;
          totalDistributionsReceived += monthlyDist;
          console.log(
            `Adding distribution: $${monthlyDist.toFixed(2)} (${dist} * ${
              etf.totalShares
            } * ${multiplier})`
          );
        } else {
          console.log(
            `Skipping ${calcYear}-${calcMonth}: Invalid distribution value`
          );
        }
      }
    } else {
      console.log("\nWARNING: No purchase information found!");
    }

    console.log("\nFinal Calculations:");
    console.log(
      "Total distributions received:",
      totalDistributionsReceived.toFixed(2)
    );
    

    // Calculate monthly income for break-even using latest distribution
    const monthlyIncome = latestDistribution * etf.totalShares * multiplier;
    console.log("Monthly income:", monthlyIncome.toFixed(2));

    if (monthlyIncome === 0 || !isFinite(monthlyIncome)) {
      console.log("Invalid monthly income, returning TBD");
      return "TBD";
    }

    const remainingValue = totalValue - totalDistributionsReceived;
    const monthsToBreakEven = remainingValue / monthlyIncome;

    console.log("Remaining value:", remainingValue.toFixed(2));
    console.log("Months to break even:", monthsToBreakEven.toFixed(2));

    return {
      totalInvestment: totalValue,
      totalDistributions: totalDistributionsReceived,
      months: monthsToBreakEven,
      years: monthsToBreakEven / 12,
    };
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
            Total Distributions
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
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Next Distribution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Break Even
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Delete
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getUniqueETFs().map((etf) => {
                const currentPrice = prices[etf.ticker.toUpperCase()];
                const totalValue = etf.totalShares * currentPrice;
                const breakEven = calculateBreakEven(etf);

                return (
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
                        ${currentPrice?.toFixed(2) || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        $
                        {totalValue?.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }) || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getNextDistributionDate(etf.group).toLocaleDateString(
                          "en-US",
                          {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}{" "}
                        (${etf.nextDividendAmount})
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {breakEven === "TBD" ? (
                          "TBD"
                        ) : (
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">
                              Investment: $
                              {breakEven.totalInvestment.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              Received: $
                              {breakEven.totalDistributions.toLocaleString(
                                undefined,
                                {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                }
                              )}
                            </div>
                            <div className="text-xs text-green-600">
                              {breakEven.years < 1
                                ? `${Math.ceil(breakEven.months)} months`
                                : `${breakEven.years.toFixed(1)} years`}
                            </div>
                          </div>
                        )}
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
                );
              })}
              {/* Total row */}
              <tr className="bg-gray-50 font-medium">
                <td
                  colSpan="4"
                  className="px-6 py-4 text-right text-sm text-gray-900"
                >
                  Total Value:
                </td>
                <td
                  colSpan="3"
                  className="px-6 py-4 whitespace-nowrap text-left"
                >
                  <div className="text-sm text-gray-900 font-medium">
                    $
                    {calculateTotalValue(getUniqueETFs()).toLocaleString(
                      undefined,
                      {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {monthlyGroups.map(({ month, etfs }, index) => {
        const monthNum =
          new Date(Date.parse(month + " 1, 2000")).getMonth() + 1;
        const sortedEtfs = sortConfig.key
          ? sortData(etfs, sortConfig.key, monthNum)
          : etfs;

        // Calculate total monthly income
        const monthlyIncomes = sortedEtfs.map((etf) =>
          calculateMonthlyIncome(etf, selectedYear, monthNum)
        );
        const currentMonthIncome = monthlyIncomes.reduce((total, income) => {
          if (income === "TBD" || typeof income !== "number") return total;
          return total + income;
        }, 0);

        // Calculate total value
        const currentMonthTotalValue = sortedEtfs.reduce((total, etf) => {
          const currentPrice = prices[etf.ticker.toUpperCase()];
          const value = etf.totalShares * currentPrice;
          return total + (value || 0);
        }, 0);

        // Check if we're using any previous month values
        const usingPreviousMonth = sortedEtfs.some((etf) => {
          const currentDist = getDistribution(
            etf.ticker.toUpperCase(),
            selectedYear,
            monthNum
          );
          return !currentDist || currentDist === 0;
        });

        return (
          <div key={month} className="bg-white rounded-lg shadow-sm mb-6">
            <div className="bg-gray-50 px-6 py-3 border-b">
              <h3 className="text-lg font-medium text-gray-900">{month}</h3>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("group", monthNum)}
                  >
                    ETF {getSortIcon("group")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("shares", monthNum)}
                  >
                    Group {getSortIcon("shares")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("value", monthNum)}
                  >
                    # of Shares {getSortIcon("value")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("monthlyIncome", monthNum)}
                  >
                    Value {getSortIcon("monthlyIncome")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("monthlyIncome", monthNum)}
                  >
                    Distribution {getSortIcon("monthlyIncome")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("monthlyIncome", monthNum)}
                  >
                    Monthly Income {getSortIcon("monthlyIncome")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedEtfs.map((etf) => {
                  const { group } = getETFDetails(etf.ticker);
                  const distribution = getMonthlyDistribution(
                    etf.ticker.toUpperCase(),
                    selectedYear,
                    monthNum
                  );
                  const monthlyIncome = calculateMonthlyIncome(
                    etf,
                    selectedYear,
                    monthNum
                  );
                  const currentPrice = prices[etf.ticker.toUpperCase()];
                  const totalValue = etf.totalShares * currentPrice;

                  // Check if this ETF is using previous month's value
                  const isUsingPrevMonth = !getDistribution(
                    etf.ticker.toUpperCase(),
                    selectedYear,
                    monthNum
                  );

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
                          {etf.totalShares}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          $
                          {totalValue?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {distribution === "TBD"
                            ? "TBD"
                            : `$${distribution.toFixed(2)}${
                                isUsingPrevMonth ? "*" : ""
                              }`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-green-600 font-medium">
                          {monthlyIncome === "TBD"
                            ? "TBD"
                            : `$${monthlyIncome.toFixed(2)}${
                                isUsingPrevMonth ? "*" : ""
                              }`}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-gray-50 font-medium">
                  <td
                    colSpan="3"
                    className="px-6 py-4 text-right text-sm text-gray-900"
                  >
                    Total Value:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-medium">
                      $
                      {currentMonthTotalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </td>
                  <td
                    colSpan="1"
                    className="px-6 py-4 text-right text-sm text-gray-900"
                  >
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-green-600 font-medium">
                      ${currentMonthIncome.toFixed(2)}
                      {usingPreviousMonth ? "*" : ""}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}
      <div className="text-xs text-gray-500 mt-2">
        * Using previous month's distribution
      </div>
    </div>
  );
};

export default PortfolioView;
