import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import {
  collection,
  doc,
  updateDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";
import { DISTRIBUTIONS } from "../../data/distributions";
import { useAuth } from "../../context/AuthContext";

const DistributionAdmin = () => {
  const { logout } = useAuth();
  const [distributions, setDistributions] = useState({});
  const [selectedETF, setSelectedETF] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Group ETFs by frequency
  const groupedETFs = Object.entries(DISTRIBUTIONS).reduce(
    (acc, [ticker, data]) => {
      const group =
        data.frequency === "weekly"
          ? "WEEKLY"
          : data.frequency === "13x" && ticker <= "FEAT"
          ? "GROUP_A"
          : data.frequency === "13x"
          ? "GROUP_B"
          : ticker <= "ABNY"
          ? "GROUP_C"
          : "GROUP_D";

      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push({ ticker, ...data });
      return acc;
    },
    {}
  );

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "distributions"),
      (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setDistributions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching distributions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedETF || !amount) return;

    try {
      const distributionRef = doc(db, "distributions", selectedETF);
      const distributionData = distributions[selectedETF] || {
        ticker: selectedETF,
        history: {},
      };

      // Create year object if it doesn't exist
      if (!distributionData.history[year]) {
        distributionData.history[year] = {};
      }

      // Update the specific month
      distributionData.history[year][month] =
        amount === "TBD" ? "TBD" : parseFloat(amount);

      console.log("Saving distribution data:", distributionData);

      // Save the entire updated document
      await setDoc(distributionRef, distributionData);

      setAmount("");
      setEditMode(false);
      alert("Distribution updated successfully!");
    } catch (error) {
      console.error("Error updating distribution:", error);
      alert("Error updating distribution: " + error.message);
    }
  };

  const handleEdit = (histYear, histMonth, histAmount) => {
    setYear(parseInt(histYear));
    setMonth(parseInt(histMonth));
    setAmount(histAmount.toString());
    setEditMode(true);
  };

  const getMonthName = (monthNum) => {
    return new Date(2000, monthNum - 1).toLocaleString("default", {
      month: "long",
    });
  };

  const renderDistributionTable = () => {
    return (
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                ETF
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Frequency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Latest Distribution
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(DISTRIBUTIONS).map(([ticker, etfData]) => {
              const distribution = distributions[ticker];
              let latestAmount = "No data";
              let latestDate = "";

              if (distribution?.history) {
                const years = Object.keys(distribution.history).sort(
                  (a, b) => b - a
                );
                for (const year of years) {
                  const months = Object.keys(distribution.history[year]).sort(
                    (a, b) => b - a
                  );
                  if (months.length > 0) {
                    const month = months[0];
                    const amount = distribution.history[year][month];
                    latestAmount = amount === "TBD" ? "TBD" : `$${amount}`;
                    latestDate = `${getMonthName(month)} ${year}`;
                    break;
                  }
                }
              }

              return (
                <tr key={ticker}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticker}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {etfData.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {latestAmount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {latestDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => {
                        setSelectedETF(ticker);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Distribution Admin</h1>
        <button
          onClick={logout}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Logout
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select ETF
          </label>
          <select
            value={selectedETF}
            onChange={(e) => setSelectedETF(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an ETF</option>
            {Object.entries(groupedETFs).map(([group, etfs]) => (
              <optgroup key={group} label={group}>
                {etfs.map((etf) => (
                  <option key={etf.ticker} value={etf.ticker}>
                    {etf.ticker} ({etf.frequency})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount or TBD"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {editMode ? "Update Distribution" : "Add Distribution"}
        </button>

        {editMode && (
          <button
            type="button"
            onClick={() => {
              setEditMode(false);
              setAmount("");
            }}
            className="w-full px-4 py-2 mt-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel Edit
          </button>
        )}
      </form>

      {selectedETF && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">
            Distribution History for {selectedETF}
          </h2>
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {distributions[selectedETF]?.history &&
                  Object.entries(distributions[selectedETF].history)
                    .sort((a, b) => b[0] - a[0]) // Sort years descending
                    .map(([histYear, months]) =>
                      Object.entries(months)
                        .sort((a, b) => b[0] - a[0]) // Sort months descending
                        .map(([histMonth, histAmount]) => (
                          <tr key={`${histYear}-${histMonth}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {histYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getMonthName(histMonth)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {histAmount === "TBD" ? "TBD" : `$${histAmount}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <button
                                onClick={() =>
                                  handleEdit(histYear, histMonth, histAmount)
                                }
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">All ETF Distributions</h2>
        {renderDistributionTable()}
      </div>
    </div>
  );
};

export default DistributionAdmin;
