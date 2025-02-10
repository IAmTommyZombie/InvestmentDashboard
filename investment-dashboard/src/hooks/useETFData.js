import { useState, useEffect } from "react";
import { usePortfolio } from "../context/PortfolioContext";
import {
  calculateMonthlyDividends,
  calculatePortfolioValue,
} from "../utils/calculations";

export const useETFData = () => {
  const { portfolio } = usePortfolio();
  const [monthlyDividends, setMonthlyDividends] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(0);

  useEffect(() => {
    setMonthlyDividends(calculateMonthlyDividends(portfolio));
    setPortfolioValue(calculatePortfolioValue(portfolio));
  }, [portfolio]);

  return {
    monthlyDividends,
    portfolioValue,
    currentMonthDividend:
      monthlyDividends[monthlyDividends.length - 1]?.totalDividend || 0,
  };
};
