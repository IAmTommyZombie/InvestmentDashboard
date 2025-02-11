import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  ArrowUp,
  ArrowDown,
  Loader2,
  Calendar,
  DollarSign,
  CircleDollarSign,
} from "lucide-react";
import { DISTRIBUTIONS } from "../../data/distributions";
import { getDistribution } from "../../data/distributions";

const API_URL = "http://localhost:3500/api";

const getSeriesColorClasses = (series) => {
  switch (series) {
    case "weekly":
      return {
        bgColor: "bg-blue-50",
        headerBgColor: "bg-blue-100",
        textColor: "text-blue-900",
      };
    case "seriesA":
      return {
        bgColor: "bg-green-50",
        headerBgColor: "bg-green-100",
        textColor: "text-green-900",
      };
    case "seriesB":
      return {
        bgColor: "bg-purple-50",
        headerBgColor: "bg-purple-100",
        textColor: "text-purple-900",
      };
    case "seriesC":
      return {
        bgColor: "bg-orange-50",
        headerBgColor: "bg-orange-100",
        textColor: "text-orange-900",
      };
    case "seriesD":
      return {
        bgColor: "bg-pink-50",
        headerBgColor: "bg-pink-100",
        textColor: "text-pink-900",
      };
    default:
      return {
        bgColor: "bg-gray-50",
        headerBgColor: "bg-gray-100",
        textColor: "text-gray-900",
      };
  }
};

const getNextDistributionDate = (series) => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();

  switch (series) {
    case "weekly":
      // Next Friday
      const nextFriday = new Date();
      nextFriday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
      // If today is Friday and we've passed distribution time, move to next week
      if (today.getDay() === 5 && today.getHours() >= 16) {
        nextFriday.setDate(nextFriday.getDate() + 7);
      }
      return nextFriday;

    case "seriesA":
      // 21st of each month
      let seriesADate = new Date(currentYear, currentMonth, 21);
      if (currentDate > 21) {
        seriesADate = new Date(currentYear, currentMonth + 1, 21);
      }
      return seriesADate;

    case "seriesB":
      // 28th of each month
      let seriesBDate = new Date(currentYear, currentMonth, 28);
      if (currentDate > 28) {
        seriesBDate = new Date(currentYear, currentMonth + 1, 28);
      }
      return seriesBDate;

    case "seriesC":
      // 7th of each month
      let seriesCDate = new Date(currentYear, currentMonth, 7);
      if (currentDate > 7) {
        seriesCDate = new Date(currentYear, currentMonth + 1, 7);
      }
      return seriesCDate;

    case "seriesD":
      // 14th of each month
      let seriesDDate = new Date(currentYear, currentMonth, 14);
      if (currentDate > 14) {
        seriesDDate = new Date(currentYear, currentMonth + 1, 14);
      }
      return seriesDDate;

    default:
      return new Date();
  }
};

const getYearlyPayments = (series) => {
  switch (series) {
    case "weekly":
      return 52; // Weekly payments
    case "seriesA":
    case "seriesB":
    case "seriesC":
    case "seriesD":
      return 13; // 13 payments per year
    default:
      return 12;
  }
};

const DashboardGrid = () => {
  const [etfs, setEtfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current year and month
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/prices/latest`);
        setEtfs(response.data);
        setLoading(false);
      } catch (error) {
        setError("Failed to fetch ETF data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const groupETFsByDistribution = (etfs) => {
    const weeklyTickers = ["YMAG", "YMAX", "LFGY", "GPTY"];
    const groupATickers = [
      "TSLY",
      "GOOY",
      "YBIT",
      "OARK",
      "XOMO",
      "TSMY",
      "CRSH",
      "FIVY",
      "FEAT",
    ];
    const groupBTickers = [
      "NVDY",
      "FBY",
      "GDXY",
      "JPMO",
      "MRNY",
      "MARO",
      "PLTY",
    ];
    const groupCTickers = [
      "CONY",
      "MSFO",
      "AMDY",
      "NFLY",
      "PYPY",
      "ULTY",
      "ABNY",
    ];
    const groupDTickers = [
      "MSTY",
      "AMZY",
      "APLY",
      "DISO",
      "SQY",
      "SMCY",
      "AIYY",
    ];

    const grouped = etfs.reduce((acc, etf) => {
      let distribution;

      if (weeklyTickers.includes(etf.ticker)) {
        distribution = "weekly";
      } else if (groupATickers.includes(etf.ticker)) {
        distribution = "seriesA";
      } else if (groupBTickers.includes(etf.ticker)) {
        distribution = "seriesB";
      } else if (groupCTickers.includes(etf.ticker)) {
        distribution = "seriesC";
      } else if (groupDTickers.includes(etf.ticker)) {
        distribution = "seriesD";
      } else {
        distribution = "unknown";
      }

      if (!acc[distribution]) {
        acc[distribution] = [];
      }
      acc[distribution].push({
        ...etf,
        distribution: DISTRIBUTIONS[etf.ticker] || 0, // Add distribution from DISTRIBUTIONS
      });
      return acc;
    }, {});

    return grouped;
  };

  const groupedETFs = groupETFsByDistribution(etfs);

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
    <div className="space-y-6">
      {Object.entries(groupedETFs).map(([distribution, etfs]) => {
        const { bgColor, headerBgColor, textColor } =
          getSeriesColorClasses(distribution);
        const yearlyPayments = getYearlyPayments(distribution);

        return (
          <div
            key={distribution}
            className={`${bgColor} rounded-lg shadow-sm overflow-hidden`}
          >
            <div
              className={`px-6 py-4 border-b border-gray-200 ${headerBgColor}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className={`text-lg font-medium ${textColor} capitalize`}>
                    {distribution}
                  </h2>
                </div>
                <div
                  className={`text-sm ${textColor} opacity-75 flex items-center`}
                >
                  <Calendar className="inline-block w-4 h-4 mr-1" />
                  Next Distribution:{" "}
                  {getNextDistributionDate(distribution).toLocaleDateString(
                    "en-US",
                    {
                      month: "numeric",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {etfs.map((etf) => {
                // Get the current month's distribution amount
                const monthlyDist = getDistribution(
                  etf.ticker,
                  currentYear,
                  currentMonth
                );
                const yearlyDist = monthlyDist * yearlyPayments;

                return (
                  <div
                    key={etf.ticker}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="mb-2">
                      <h3 className="text-lg font-medium">{etf.ticker}</h3>
                      <p className="text-sm text-gray-500">{etf.name}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" /> Price
                        </p>
                        <p className="text-lg font-medium">
                          ${etf.price?.toFixed(2) || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 flex items-center">
                          <CircleDollarSign className="w-4 h-4 mr-1" /> Monthly
                          Dist.
                        </p>
                        <p className="text-lg font-medium">
                          ${monthlyDist.toFixed(2)}
                          <span className="text-xs text-gray-500 block">
                            ${yearlyDist.toFixed(2)}/yr ({yearlyPayments}x)
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm text-gray-500">
                        Yield: {((yearlyDist / etf.price) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardGrid;
