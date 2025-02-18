import React, { useState, useEffect } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { availableETFs } from "../../data/availableETFs";
import { X, ChevronDown } from "lucide-react";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Add the ETF_GROUPS constant at the top
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

// Add group names for better display
const GROUP_NAMES = {
  WEEKLY: "Weekly Distributions",
  GROUP_A: "Group A - 13x/Year",
  GROUP_B: "Group B - 13x/Year",
  GROUP_C: "Group C - Monthly",
  GROUP_D: "Group D - Monthly",
};

const client = new DynamoDBClient({
  region: "us-east-2",
});
const docClient = DynamoDBDocumentClient.from(client);

const AddETFForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    ticker: "",
    totalShares: "",
    group: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });
  const [prices, setPrices] = useState({});
  const [distributions, setDistributions] = useState({});

  // Add price and distribution listeners
  useEffect(() => {
    const priceUnsubscribe = onSnapshot(
      collection(db, "prices"),
      (snapshot) => {
        const priceData = {};
        snapshot.forEach((doc) => {
          priceData[doc.id] = doc.data();
        });
        setPrices(priceData);
      }
    );

    const distributionUnsubscribe = onSnapshot(
      collection(db, "distributions"),
      (snapshot) => {
        const distData = {};
        snapshot.forEach((doc) => {
          distData[doc.id] = doc.data();
        });
        setDistributions(distData);
      }
    );

    return () => {
      priceUnsubscribe();
      distributionUnsubscribe();
    };
  }, []);

  // Update the grouping logic
  const groupedETFs = availableETFs.reduce((acc, etf) => {
    let group =
      Object.entries(ETF_GROUPS).find(([_, tickers]) =>
        tickers.includes(etf.ticker)
      )?.[0] || "OTHER";

    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(etf);
    return acc;
  }, {});

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const totalShares = Number(formData.totalShares);
      if (isNaN(totalShares)) {
        throw new Error("Shares must be a valid number");
      }

      const currentPrice = prices[formData.ticker]?.currentPrice;
      if (!currentPrice) {
        throw new Error("Could not get current price for selected ETF");
      }

      // Get current distribution
      const distribution = getCurrentDistribution(formData.ticker);
      console.log("Distribution for", formData.ticker, ":", distribution);

      // Create the ETF item
      const etfItem = {
        ticker: formData.ticker.toUpperCase(),
        totalShares,
        purchaseDate: formData.purchaseDate,
        distribution,
        purchases: [
          {
            date: formData.purchaseDate,
            shares: totalShares,
            price: Number(currentPrice),
          },
        ],
        createdAt: new Date().toISOString(),
      };

      // Add to DynamoDB
      await docClient.send(
        new PutCommand({
          TableName: "etfs",
          Item: etfItem,
        })
      );

      // Clear form and close
      setFormData({
        ticker: "",
        totalShares: "",
        purchaseDate: new Date().toISOString().split("T")[0],
      });
      onClose();
    } catch (error) {
      console.error("Error adding ETF:", error);
      alert("Error adding ETF");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "ticker") {
      const selectedETF = availableETFs.find((etf) => etf.ticker === value);
      setFormData((prev) => ({
        ...prev,
        ticker: value,
        group: selectedETF ? selectedETF.group : prev.group,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Add current price display when ETF is selected
  const selectedPrice = formData.ticker
    ? prices[formData.ticker]?.currentPrice
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add ETF</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select ETF
            </label>
            <div className="relative">
              <select
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">Select an ETF</option>
                {Object.entries(groupedETFs).map(([group, etfs]) => (
                  <optgroup key={group} label={GROUP_NAMES[group] || group}>
                    {etfs.map((etf) => (
                      <option key={etf.ticker} value={etf.ticker}>
                        {etf.ticker} ({etf.frequency})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {selectedPrice && (
              <p className="mt-1 text-sm text-gray-500">
                Current Price: ${selectedPrice.toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Shares
            </label>
            <input
              type="number"
              name="totalShares"
              value={formData.totalShares}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter number of shares"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Add ETF
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddETFForm;
