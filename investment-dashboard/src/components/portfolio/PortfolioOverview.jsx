import React from "react";
import StatCard from "./StatCard";
import { Wallet, TrendingUp, PieChart, BarChart, Clock } from "lucide-react";
import { usePortfolio } from "../../context/PortfolioContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PortfolioOverview = () => {
  // Use the same context as PortfolioView
  const { etfs, stats, loading, error } = usePortfolio();

  const calculateStats = () => {
    const totalValue = etfs.reduce(
      (sum, etf) => sum + etf.shares * etf.currentPrice,
      0
    );
    const monthlyIncome = etfs.reduce(
      (sum, etf) => sum + etf.shares * etf.distribution,
      0
    );
    const yieldRate =
      totalValue > 0 ? ((monthlyIncome * 12) / totalValue) * 100 : 0;

    return {
      totalValue: {
        value: totalValue,
        trend: 0,
      },
      monthlyIncome: {
        value: monthlyIncome,
        trend: 0,
      },
      etfsHeld: {
        value: etfs.length,
        trend: null,
      },
      yield: {
        value: yieldRate,
        trend: 0,
      },
    };
  };

  const portfolioStats = calculateStats();

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - updateTime) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return updateTime.toLocaleDateString();
  };

  // Get prices from your ETFs instead of a separate prices array
  const etfPrices = etfs
    .map((etf) => ({
      ticker: etf.ticker,
      price: etf.currentPrice,
      source: etf.priceSource || "yahoo",
      timestamp: etf.lastUpdated || new Date(),
    }))
    .sort((a, b) => a.ticker.localeCompare(b.ticker));

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Value"
          value={portfolioStats.totalValue.value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
          icon={Wallet}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          prefix="$"
          trend={portfolioStats.totalValue.trend}
        />

        <StatCard
          title="Monthly Income"
          value={portfolioStats.monthlyIncome.value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
          })}
          icon={TrendingUp}
          bgColor="bg-green-50"
          iconColor="text-green-600"
          prefix="$"
          trend={portfolioStats.monthlyIncome.trend}
        />

        <StatCard
          title="ETFs Held"
          value={portfolioStats.etfsHeld.value}
          icon={PieChart}
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          trend={portfolioStats.etfsHeld.trend}
        />

        <StatCard
          title="Yield"
          value={portfolioStats.yield.value.toFixed(2)}
          icon={BarChart}
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
          suffix="%"
          trend={portfolioStats.yield.trend}
        />
      </div>

      {/* Prices and Chart */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Latest Prices</span>
              <div className="flex items-center text-sm font-normal text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                Auto-updates every 5 min
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div>Loading prices...</div>
              ) : error ? (
                <div className="text-red-500">{error}</div>
              ) : (
                etfPrices.slice(0, 6).map((price) => (
                  <div
                    key={price.ticker}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{price.ticker}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          price.source === "yahoo"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {price.source}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        ${Number(price.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTimeAgo(price.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={etfs.map((etf) => ({
                    name: etf.ticker,
                    value: etf.shares * etf.currentPrice,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                      "Value",
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioOverview;
