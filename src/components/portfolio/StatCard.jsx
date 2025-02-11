import React from "react";
import { LucideIcon } from "lucide-react";

const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor = "bg-blue-50",
  iconColor = "text-blue-600",
  trend,
  prefix = "",
  suffix = "",
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center">
        <div className={`p-2 ${bgColor} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-gray-900">
              {prefix}
              {value}
              {suffix}
            </h3>
            {trend && (
              <span
                className={`text-sm ${
                  trend > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
