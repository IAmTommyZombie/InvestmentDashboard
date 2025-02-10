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
  const currentMonth = today.getMonth();
  const currentWeek = Math.ceil(today.getDate() / 7);

  switch (series) {
    case "weekly":
      const nextFriday = new Date();
      nextFriday.setDate(today.getDate() + ((5 + 7 - today.getDay()) % 7));
      return nextFriday;
    case "seriesA":
      return new Date(
        today.getFullYear(),
        currentMonth + (currentWeek > 1 ? 1 : 0),
        21
      );
    case "seriesB":
      return new Date(
        today.getFullYear(),
        currentMonth + (currentWeek > 2 ? 1 : 0),
        28
      );
    case "seriesC":
      return new Date(
        today.getFullYear(),
        currentMonth + (currentWeek > 3 ? 1 : 0),
        7
      );
    case "seriesD":
      return new Date(
        today.getFullYear(),
        currentMonth + (currentWeek > 4 ? 1 : 0),
        14
      );
    default:
      return ""; // Return an empty string or a default date for unknown series
  }
};

const DashboardGrid = () => {
  const [etfs, setEtfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      // Check if the ETF ticker belongs to one of the groups
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
      } else if (etf.distribution === 0.26) {
        distribution = "weekly";
      } else if (etf.distribution >= 0.83 && etf.distribution <= 0.95) {
        distribution = `series${String.fromCharCode(
          65 + Math.floor((etf.distribution - 0.83) / 0.03)
        )}`;
      } else {
        distribution = "unknown";
      }

      if (!acc[distribution]) {
        acc[distribution] = [];
      }
      acc[distribution].push(etf);
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
                  {typeof getNextDistributionDate(distribution) === "string"
                    ? getNextDistributionDate(distribution)
                    : getNextDistributionDate(
                        distribution
                      ).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {etfs.map((etf) => {
                const isPositive = etf.price >= etf.prevPrice;
                return (
                  <div
                    key={etf.ticker}
                    className="bg-white rounded-lg p-4 shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-medium">{etf.ticker}</h3>
                        <p className="text-sm text-gray-500">{etf.name}</p>
                      </div>
                      <div
                        className={`flex items-center ${
                          isPositive ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isPositive ? (
                          <ArrowUp className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowDown className="w-4 h-4 mr-1" />
                        )}
                        {Math.abs(
                          (etf.price - etf.prevPrice) / etf.prevPrice
                        ).toFixed(2)}
                        %
                      </div>
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
                          <CircleDollarSign className="w-4 h-4 mr-1" /> Dividend
                        </p>
                        <p className="text-lg font-medium">
                          ${etf.distribution?.toFixed(2) || "N/A"}
                        </p>
                      </div>
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
