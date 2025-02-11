import React, { useState, useEffect } from "react";
import { getAllETFData, getDistributionInfo } from "../../services/etfService";
import { ArrowUp, ArrowDown, Loader2 } from "lucide-react";

const ETFOverview = () => {
  const [etfData, setEtfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getAllETFData();
        setEtfData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700">
        Error loading ETF data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(etfData).map(([series, etfs]) => (
        <div key={series} className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 capitalize">
              {series === "weekly"
                ? "Weekly Distribution"
                : `Group ${series.slice(-1)}`}
            </h2>
            <p className="text-sm text-gray-500">
              {getDistributionInfo(series)}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ETF
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    24h Change
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Volume
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {etfs.map((etf) => {
                  const isPositive = etf.dailyChange >= 0;
                  return (
                    <tr key={etf.ticker}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {etf.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {etf.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${etf.currentPrice?.toFixed(2) || "N/A"}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        <div className="flex items-center">
                          {isPositive ? (
                            <ArrowUp className="w-4 h-4 mr-1" />
                          ) : (
                            <ArrowDown className="w-4 h-4 mr-1" />
                          )}
                          {Math.abs(etf.dailyChange).toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {etf.volume?.toLocaleString() || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ETFOverview;
