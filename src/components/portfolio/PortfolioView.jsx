import React, { useState, useEffect } from "react";
import { Trash2, Plus, Calendar } from "lucide-react";
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
  const { portfolio } = usePortfolio();
  const { monthlyDistribution } = useDistributionContext();
  const [etfs, setEtfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedYear] = useState(new Date().getFullYear());
  const [selectedMonth] = useState(new Date().getMonth());
  const [sortConfig, setSortConfig] = useState({
    key: "value",
    direction: "desc",
  });
  const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);
  const [selectedEtf, setSelectedEtf] = useState(null);
  const [newPurchase, setNewPurchase] = useState({
    date: new Date().toISOString().split("T")[0],
    shares: "",
    price: "",
  });
  const [prices, setPrices] = useState({});
  const [distributions, setDistributions] = useState({});
  const { getLatestDistribution, loading: distributionLoading } =
    useDistributions();

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <span className="ml-1">↑</span>
    ) : (
      <span className="ml-1">↓</span>
    );
  };

  const sortData = (data) => {
    const sortedData = [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "ticker":
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case "group":
          aValue = a.group;
          bValue = b.group;
          break;
        case "shares":
          aValue = Number(a.totalShares);
          bValue = Number(b.totalShares);
          break;
        case "value":
          aValue = a.totalShares * (a.currentPrice || 0);
          bValue = b.totalShares * (b.currentPrice || 0);
          break;
        case "monthlyIncome":
          const aIncome = calculateMonthlyIncome(
            a,
            selectedYear,
            selectedMonth + 1
          );
          const bIncome = calculateMonthlyIncome(
            b,
            selectedYear,
            selectedMonth + 1
          );
          aValue = aIncome === "TBD" ? -1 : aIncome;
          bValue = bIncome === "TBD" ? -1 : bIncome;
          break;
        case "breakEven":
          const aBreakEven = calculateBreakEven(a);
          const bBreakEven = calculateBreakEven(b);
          aValue = aBreakEven === "TBD" ? Infinity : aBreakEven.months;
          bValue = bBreakEven === "TBD" ? Infinity : bBreakEven.months;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

    return sortedData;
  };

  useEffect(() => {
    // Subscribe to prices
    const pricesUnsubscribe = onSnapshot(
      collection(db, "prices"),
      (snapshot) => {
        const priceData = {};
        snapshot.forEach((doc) => {
          priceData[doc.id] = doc.data().currentPrice;
        });
        setPrices(priceData);
      },
      (error) => {
        console.error("Error fetching prices:", error);
      }
    );

    // Subscribe to distributions
    const distributionsUnsubscribe = onSnapshot(
      collection(db, "distributions"),
      (snapshot) => {
        const distributionData = {};
        snapshot.forEach((doc) => {
          distributionData[doc.id] = doc.data().distributions;
        });
        setDistributions(distributionData);
      },
      (error) => {
        console.error("Error fetching distributions:", error);
      }
    );

    // Cleanup subscriptions
    return () => {
      pricesUnsubscribe();
      distributionsUnsubscribe();
    };
  }, []);

  // Fetch ETFs from Firebase
  useEffect(() => {
    try {
      const etfsRef = collection(db, "etfs");
      const q = query(etfsRef);

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const etfsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Calculate monthly income for each ETF
        const etfsWithIncome = await Promise.all(
          etfsData.map(async (etf) => {
            const distribution = await getDistribution(
              etf.ticker,
              selectedYear,
              selectedMonth + 1
            );
            return {
              ...etf,
              monthlyIncome: distribution * etf.totalShares,
              group: etf.group || "GROUP_A", // Default group if none specified
            };
          })
        );

        setEtfs(etfsWithIncome);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching ETFs:", error);
      setError("Failed to fetch ETFs");
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Group ETFs by month
  const groupEtfsByMonth = () => {
    const months = Array(12)
      .fill()
      .map((_, i) => i);

    return months
      .map((month) => {
        const monthName = new Date(selectedYear, month).toLocaleString(
          "default",
          { month: "long" }
        );

        return {
          month: monthName,
          etfs: etfs.map((etf) => ({
            ...etf,
            monthlyIncome: calculateMonthlyIncome(etf, selectedYear, month + 1),
          })),
        };
      })
      .filter((group) => group.etfs.length > 0);
  };

  // Calculate monthly income for an ETF
  const calculateMonthlyIncome = async (etf, year, month) => {
    const distribution = await getDistribution(etf.ticker, year, month);
    if (distribution === "TBD") return "TBD";

    const multiplier = ["WEEKLY"].includes(etf.group) ? 52 / 12 : 1;
    return distribution * etf.totalShares * multiplier;
  };

  // Calculate total value
  const calculateTotalValue = (shares, price) => {
    return shares * price;
  };

  const calculateBreakEven = (etf) => {
    console.log("Calculating break-even for", etf.ticker);

    const currentPrice = etf.currentPrice || 0;
    const totalValue = etf.totalShares * currentPrice;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get frequency multiplier based on group
    const multiplier = etf.group === "WEEKLY" ? 52 / 12 : 13 / 12;

    // Get latest valid distribution
    let latestDistribution = null;
    for (let year = currentYear; year >= 2024; year--) {
      for (
        let month = year === currentYear ? currentMonth : 12;
        month >= 1;
        month--
      ) {
        const dist = getDistribution(etf.ticker, year, month);
        if (dist && dist !== "TBD" && typeof dist === "number") {
          latestDistribution = dist;
          break;
        }
      }
      if (latestDistribution) break;
    }

    if (!latestDistribution) return "TBD";

    // Calculate total distributions received
    let totalDistributionsReceived = 0;
    if (etf.purchaseDate) {
      const purchaseDate = new Date(etf.purchaseDate);
      let purchaseYear = purchaseDate.getFullYear();
      let purchaseMonth = purchaseDate.getMonth() + 1;

      // Calculate months between purchase date and today
      const monthDiff =
        (currentYear - purchaseYear) * 12 + (currentMonth - purchaseMonth);

      // For each month since purchase
      for (let i = 0; i <= monthDiff; i++) {
        const calcMonth = ((purchaseMonth - 1 + i) % 12) + 1;
        const calcYear =
          purchaseYear + Math.floor((purchaseMonth - 1 + i) / 12);

        const dist = getDistribution(etf.ticker, calcYear, calcMonth);
        if (dist && dist !== "TBD" && typeof dist === "number") {
          totalDistributionsReceived += dist * etf.totalShares * multiplier;
        }
      }
    }

    // Calculate monthly income using latest distribution
    const monthlyIncome = latestDistribution * etf.totalShares * multiplier;
    if (monthlyIncome === 0) return "TBD";

    const remainingValue = totalValue - totalDistributionsReceived;
    const monthsToBreakEven = remainingValue / monthlyIncome;

    return {
      totalInvestment: totalValue,
      totalDistributions: totalDistributionsReceived,
      months: monthsToBreakEven,
      years: monthsToBreakEven / 12,
    };
  };

  const calculateStats = () => {
    const totalValue = etfs.reduce((sum, etf) => {
      return sum + etf.totalShares * (etf.currentPrice || 0);
    }, 0);

    const monthlyIncome = etfs.reduce((sum, etf) => {
      const income = calculateMonthlyIncome(
        etf,
        selectedYear,
        selectedMonth + 1
      );
      return sum + (typeof income === "number" ? income : 0);
    }, 0);

    const yearlyIncome = monthlyIncome * 12;
    const averageYield = totalValue > 0 ? (yearlyIncome / totalValue) * 100 : 0;

    const totalShares = etfs.reduce(
      (sum, etf) => sum + Number(etf.totalShares),
      0
    );
    const totalDistributionsReceived = etfs.reduce((sum, etf) => {
      const breakEven = calculateBreakEven(etf);
      return sum + (breakEven !== "TBD" ? breakEven.totalDistributions : 0);
    }, 0);

    return {
      totalValue,
      monthlyIncome,
      yearlyIncome,
      averageYield,
      totalShares,
      totalDistributionsReceived,
    };
  };

  const handleAddPurchase = async (etfId) => {
    if (!newPurchase.shares || !newPurchase.price) {
      alert("Please fill in all fields");
      return;
    }

    try {
      const etfRef = doc(db, "etfs", etfId);
      await updateDoc(etfRef, {
        purchases: arrayUnion({
          date: newPurchase.date,
          shares: Number(newPurchase.shares),
          price: Number(newPurchase.price),
        }),
        totalShares: selectedEtf.totalShares + Number(newPurchase.shares),
      });

      setNewPurchase({
        date: new Date().toISOString().split("T")[0],
        shares: "",
        price: "",
      });
      setShowPurchaseHistory(false);
      setSelectedEtf(null);
    } catch (error) {
      console.error("Error adding purchase:", error);
      alert("Failed to add purchase");
    }
  };

  // Purchase History Dialog
  const PurchaseHistoryDialog = () => {
    if (!showPurchaseHistory || !selectedEtf) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">
              {selectedEtf.ticker} Purchase History
            </h3>
            <button
              onClick={() => {
                setShowPurchaseHistory(false);
                setSelectedEtf(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* Purchase History Table */}
          <div className="mb-6">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedEtf.purchases?.map((purchase, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {purchase.date}
                      </TableCell>
                      <TableCell align="right">{purchase.shares}</TableCell>
                      <TableCell align="right">
                        ${purchase.price.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        ${(purchase.shares * purchase.price).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          {/* Add New Purchase Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-4">Add New Purchase</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newPurchase.date}
                  onChange={(e) =>
                    setNewPurchase((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shares
                </label>
                <input
                  type="number"
                  value={newPurchase.shares}
                  onChange={(e) =>
                    setNewPurchase((prev) => ({
                      ...prev,
                      shares: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPurchase.price}
                  onChange={(e) =>
                    setNewPurchase((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => handleAddPurchase(selectedEtf.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add Purchase
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (distributionLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const monthlyGroups = groupEtfsByMonth();
  const totalValue = calculateTotalValue(
    etfs.reduce((sum, etf) => sum + etf.totalShares, 0),
    etfs.reduce((sum, etf) => sum + etf.currentPrice, 0)
  );
  const stats = calculateStats();

  const sortedEtfs = sortData(etfs);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Value
          </h3>
          <p className="text-2xl font-semibold">
            $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Monthly Income
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            $
            {stats.monthlyIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Yearly Income
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            $
            {stats.yearlyIncome.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Average Yield
          </h3>
          <p className="text-2xl font-semibold">
            {stats.averageYield.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Shares
          </h3>
          <p className="text-2xl font-semibold">
            {stats.totalShares.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">
            Total Distributions Received
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            $
            {stats.totalDistributionsReceived.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Holdings Table with Sortable Headers */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Symbol</TableCell>
                  <TableCell align="right">Shares</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="right">Total Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {portfolio.map((holding) => (
                  <TableRow key={holding.symbol}>
                    <TableCell component="th" scope="row">
                      {holding.symbol}
                    </TableCell>
                    <TableCell align="right">{holding.shares}</TableCell>
                    <TableCell align="right">
                      ${holding.price?.toFixed(2) || "N/A"}
                    </TableCell>
                    <TableCell align="right">
                      $
                      {calculateTotalValue(
                        holding.shares,
                        holding.price
                      )?.toFixed(2) || "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </div>

      {/* Monthly Breakdown with Sorting */}
      {monthlyGroups.map(({ month, etfs: monthlyEtfs }) => (
        <div key={month} className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">{month}</h3>
          </div>
          <div className="overflow-x-auto">
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Symbol</TableCell>
                    <TableCell align="right">Shares</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthlyEtfs.map((etf) => (
                    <TableRow key={etf.ticker}>
                      <TableCell component="th" scope="row">
                        {etf.ticker}
                      </TableCell>
                      <TableCell align="right">{etf.totalShares}</TableCell>
                      <TableCell align="right">
                        ${etf.currentPrice?.toFixed(2) || "N/A"}
                      </TableCell>
                      <TableCell align="right">
                        $
                        {(etf.totalShares * etf.currentPrice).toFixed(2) ||
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </div>
      ))}

      {/* Purchase History Dialog */}
      <PurchaseHistoryDialog />
    </div>
  );
};

export default PortfolioView;
