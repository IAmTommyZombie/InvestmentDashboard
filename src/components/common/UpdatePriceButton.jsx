import React, { useState } from "react";
import { updatePrices } from "../../services/priceService";

const UpdatePriceButton = ({ ticker, onUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState(null);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setStatus("Updating...");

    try {
      const result = await updatePrices(ticker);
      if (result.success) {
        setStatus("Updated!");
        if (onUpdate) onUpdate(result);
      } else {
        setStatus("Failed");
      }
    } catch (error) {
      setStatus("Error");
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setStatus(null), 3000); // Clear status after 3 seconds
    }
  };

  return (
    <button
      onClick={handleUpdate}
      disabled={isUpdating}
      className={`px-3 py-1 rounded-md text-sm ${
        isUpdating
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      {status || "Update Price"}
    </button>
  );
};

export default UpdatePriceButton;
