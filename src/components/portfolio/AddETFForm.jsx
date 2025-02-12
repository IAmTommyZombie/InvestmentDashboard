import React, { useState } from "react";
import { db } from "../../firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { availableETFs } from "../../data/availableETFs";
import { X, ChevronDown } from "lucide-react";

const AddETFForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    ticker: "",
    totalShares: "",
    group: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  // Group ETFs by their group
  const groupedETFs = availableETFs.reduce((acc, etf) => {
    const group = etf.group;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(etf);
    return acc;
  }, {});

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const etfsRef = collection(db, "etfs");

      const totalShares = Number(formData.totalShares);
      if (isNaN(totalShares)) {
        throw new Error("Shares must be a valid number");
      }

      await addDoc(etfsRef, {
        ...formData,
        totalShares,
        createdAt: new Date(),
        ticker: formData.ticker.toUpperCase(),
        purchases: [
          {
            date: formData.purchaseDate,
            shares: totalShares,
            price: 0,
          },
        ],
      });

      onClose();
    } catch (error) {
      console.error("Error adding ETF:", error);
      alert("Failed to add ETF: " + error.message);
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
                  <optgroup key={group} label={group.replace("_", " ")}>
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
