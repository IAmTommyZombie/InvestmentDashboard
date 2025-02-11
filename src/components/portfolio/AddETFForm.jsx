import React, { useState } from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import { X } from "lucide-react";

const AddETFForm = ({ onClose, onSuccess }) => {
  const { addETF, validTickers } = usePortfolio();
  const defaultDate = new Date().toISOString().split("T")[0];
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    ticker: "",
    purchaseDate: defaultDate,
    shares: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (!validTickers.includes(formData.ticker.toUpperCase())) {
        setError("Please select a valid ETF ticker");
        return;
      }

      if (!formData.shares || formData.shares <= 0) {
        setError("Please enter a valid number of shares");
        return;
      }

      await addETF({
        ticker: formData.ticker.toUpperCase(),
        purchaseDate: formData.purchaseDate,
        shares: Number(formData.shares),
      });

      onSuccess?.("ETF added successfully");
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      setError("Failed to add ETF. Please try again.");
    }
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
              Purchase Date
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
