import React, { useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { X } from "lucide-react";
import { DISTRIBUTIONS } from "../../data/distributions";

const AddETFForm = ({ onClose, onSuccess }) => {
  const { addETF, validTickers } = usePortfolio();
  const defaultDate = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    ticker: "",
    shares: "",
    costBasis: "",
    currentPrice: "",
    purchaseDate: defaultDate,
  });

  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!validTickers.includes(formData.ticker.toUpperCase())) {
      setError("Please select a valid ETF ticker");
      return;
    }

    if (!formData.shares || formData.shares <= 0) {
      setError("Please enter a valid number of shares");
      return;
    }

    if (!formData.costBasis || formData.costBasis <= 0) {
      setError("Please enter a valid cost basis");
      return;
    }

    if (!formData.currentPrice || formData.currentPrice <= 0) {
      setError("Please enter a valid current price");
      return;
    }

    if (!formData.purchaseDate) {
      setError("Please enter an initial purchase date");
      return;
    }

    const ticker = formData.ticker.toUpperCase();
    const distribution = DISTRIBUTIONS[ticker] || 0;

    addETF({
      ...formData,
      ticker,
      shares: Number(formData.shares),
      costBasis: Number(formData.costBasis),
      currentPrice: Number(formData.currentPrice),
      purchaseDate: formData.purchaseDate,
      distribution, // This will automatically add the distribution from our mock data
    });

    onSuccess?.("ETF added successfully");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Add New ETF</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ETF Ticker
            </label>
            <select
              value={formData.ticker}
              onChange={(e) =>
                setFormData({ ...formData, ticker: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
              required
            >
              <option value="">Select an ETF</option>
              {validTickers.map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Purchase Date
            </label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) =>
                setFormData({ ...formData, purchaseDate: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Shares
            </label>
            <input
              type="number"
              value={formData.shares}
              onChange={(e) =>
                setFormData({ ...formData, shares: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter number of shares"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cost Basis (per share)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.costBasis}
                onChange={(e) =>
                  setFormData({ ...formData, costBasis: e.target.value })
                }
                className="w-full border rounded-md pl-6 pr-3 py-2"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.currentPrice}
                onChange={(e) =>
                  setFormData({ ...formData, currentPrice: e.target.value })
                }
                className="w-full border rounded-md pl-6 pr-3 py-2"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {formData.ticker && (
            <div className="bg-gray-50 p-3 rounded">
              <span className="text-sm text-gray-600">
                Monthly Distribution: $
                {DISTRIBUTIONS[formData.ticker.toUpperCase()]?.toFixed(2) ||
                  "0.00"}
                {formData.shares && (
                  <span className="ml-2 text-gray-500">
                    (Total: $
                    {(
                      (DISTRIBUTIONS[formData.ticker.toUpperCase()] || 0) *
                      formData.shares
                    ).toFixed(2)}
                    /month)
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700"
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
