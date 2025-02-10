import React, { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

const Notification = ({ message, type = "success", onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 w-96 z-50">
      <div
        className={`
        ${
          type === "success"
            ? "bg-green-50 text-green-800"
            : "bg-red-50 text-red-800"
        }
        p-4 rounded-lg shadow-lg border
        ${type === "success" ? "border-green-200" : "border-red-200"}
        transform transition-all duration-500 ease-in-out translate-x-0
        hover:scale-105
      `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {type === "success" ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-400" />
            )}
          </div>
          <div className="ml-3 w-full">
            <p className="text-sm font-medium">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="inline-flex text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notification;
