import React from "react";
import { usePortfolio } from "../../context/PortfolioContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const AnalyticsView = () => {
  const { monthlyData, stats } = usePortfolio();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Income Analytics
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-4">
                Monthly Income Projection
              </h4>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => ["$" + value.toFixed(2), "Income"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Annual Projected Income
                </h4>
                <p className="text-2xl font-semibold text-gray-900">
                  ${(stats.monthlyIncome * 12).toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Average Monthly Income
                </h4>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.monthlyIncome.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded">
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Portfolio Yield
                </h4>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.yieldRate.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
