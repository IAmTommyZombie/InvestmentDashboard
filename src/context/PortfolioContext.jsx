// src/context/PortfolioContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import axios from "axios";
import {
  MOCK_DIVIDEND_DATA,
  ETF_GROUPS,
  getETFGroup,
  getNextDividend,
} from "../utils/constants";

const API_URL = "http://localhost:3500/api";
const PortfolioContext = createContext();

// Distribution rates for each ETF
const DISTRIBUTIONS = {
  // WEEKLY
  YMAG: 0.26,
  YMAX: 0.26,
  LFGY: 0.26,
  GPTY: 0.26,
  // GROUP A
  TSLY: 0.85,
  GOOY: 0.95,
  YBIT: 0.88,
  OARK: 0.92,
  XOMO: 0.83,
  TSMY: 0.9,
  CRSH: 0.87,
  FIVY: 0.89,
  FEAT: 0.91,
  // GROUP B
  NVDY: 0.86,
  FBY: 0.84,
  GDXY: 0.88,
  JPMO: 0.85,
  MRNY: 0.93,
  MARO: 0.94,
  PLTY: 0.94,
  // GROUP C
  CONY: 0.94,
  MSFO: 0.94,
  AMDY: 0.94,
  NFLY: 0.94,
  PYPY: 0.94,
  ULTY: 0.94,
  ABNY: 0.94,
  // GROUP D
  MSTY: 0.94,
  AMZY: 0.94,
  APLY: 0.94,
  DISO: 0.94,
  SQY: 0.94,
  SMCY: 0.94,
  AIYY: 0.94,
};

export const PortfolioProvider = ({ children }) => {
  const [etfs, setEtfs] = useState([]);
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    try {
      console.log("Fetching prices...");
      const response = await axios.get(`${API_URL}/prices/latest`);
      console.log("Received prices:", response.data);
      setPrices(response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching prices:", error);
      return null;
    }
  };

  const fetchEtfs = async () => {
    try {
      console.log("Fetching ETFs and prices...");
      const [etfsResponse, pricesResponse] = await Promise.all([
        axios.get(`${API_URL}/etfs`),
        axios.get(`${API_URL}/prices/latest`),
      ]);

      const latestPrices = pricesResponse.data;
      console.log("Latest prices:", latestPrices);
      setPrices(latestPrices);

      // Create a map of latest prices
      const priceMap = new Map(
        latestPrices.map((price) => [price.ticker, price])
      );
      console.log("Price map:", Object.fromEntries(priceMap));

      // Combine ETF data with latest prices
      const etfsWithPrices = etfsResponse.data.map((etf) => {
        const priceData = priceMap.get(etf.ticker);
        const updatedEtf = {
          ...etf,
          currentPrice: priceData?.price || etf.currentPrice, // Ensure this aligns with the API field `price`
          distribution: priceData?.distribution || DISTRIBUTIONS[etf.ticker], // Add this if missing
          priceSource: priceData?.source || "database",
          lastUpdated: priceData?.timestamp || null,
        };
        console.log(`Updated ETF ${etf.ticker}:`, updatedEtf);
        return updatedEtf;
      });

      setEtfs(etfsWithPrices);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch portfolio data");
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchEtfs();
  }, []);

  // Set up polling for price updates
  useEffect(() => {
    const updatePrices = async () => {
      const newPrices = await fetchPrices();
      if (newPrices) {
        const priceMap = new Map(
          newPrices.map((price) => [price.ticker, price])
        );

        setEtfs((currentEtfs) =>
          currentEtfs.map((etf) => ({
            ...etf,
            currentPrice: priceMap.get(etf.ticker)?.price || etf.currentPrice,
            priceSource: priceMap.get(etf.ticker)?.source || "database",
            lastUpdated: priceMap.get(etf.ticker)?.timestamp || etf.lastUpdated,
          }))
        );
      }
    };

    const interval = setInterval(updatePrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const calculateStats = () => {
    const totalValue = etfs.reduce(
      (sum, etf) => sum + etf.shares * etf.currentPrice,
      0
    );

    const monthlyIncome = etfs.reduce(
      (sum, etf) => sum + etf.shares * etf.distribution,
      0
    );

    const totalCost = etfs.reduce((sum, etf) => {
      if (etf.purchases && etf.purchases.length > 0) {
        return (
          sum +
          etf.purchases.reduce(
            (purchaseSum, purchase) =>
              purchaseSum + Number(purchase.shares) * Number(purchase.price),
            0
          )
        );
      }
      return sum + etf.shares * etf.costBasis;
    }, 0);

    const yieldRate =
      totalCost > 0 ? ((monthlyIncome * 12) / totalCost) * 100 : 0;

    return {
      totalValue,
      monthlyIncome,
      totalCost,
      yieldRate,
    };
  };

  const addETF = async (etfData) => {
    try {
      const formattedData = {
        ticker: etfData.ticker,
        shares: Number(etfData.shares),
        costBasis: 14.36, // Set default cost basis
        purchaseDate: etfData.purchaseDate,
        distribution: Number(etfData.distribution),
        source: "database",
        timestamp: new Date().toISOString(),
      };

      console.log("Sending ETF data:", formattedData);

      const response = await axios.post(`${API_URL}/etfs`, formattedData);

      setEtfs((prevEtfs) => [...prevEtfs, response.data]);
      return response.data;
    } catch (error) {
      console.error("Error adding ETF:", error);
      if (error.response) {
        console.error("Error response:", error.response.data);
      }
      throw error;
    }
  };

  const updateETF = async (id, updatedData) => {
    try {
      const response = await axios.put(`${API_URL}/etfs/${id}`, updatedData);
      setEtfs((prev) =>
        prev.map((etf) => (etf._id === id ? response.data : etf))
      );
    } catch (error) {
      console.error("Error updating ETF:", error);
      throw error;
    }
  };

  const deleteETF = async (id) => {
    try {
      await axios.delete(`${API_URL}/etfs/${id}`);
      setEtfs((prev) => prev.filter((etf) => etf._id !== id));
    } catch (error) {
      console.error("Error deleting ETF:", error);
      throw error;
    }
  };

  const addPurchase = async (id, purchaseData) => {
    try {
      const response = await axios.post(
        `${API_URL}/etfs/${id}/purchases`,
        purchaseData
      );
      setEtfs((prev) =>
        prev.map((etf) => (etf._id === id ? response.data : etf))
      );
    } catch (error) {
      console.error("Error adding purchase:", error);
      throw error;
    }
  };

  const validTickers = useMemo(() => {
    return Object.keys(MOCK_DIVIDEND_DATA);
  }, []);

  // Get dividend amount for a specific month
  const getDividendAmount = (ticker, month) => {
    const dividendData = MOCK_DIVIDEND_DATA[ticker];
    if (!dividendData) return 0;

    const dividend = dividendData.find((d) => d.month === month);
    return dividend ? dividend.amount : 0;
  };

  // Get ETF group
  const getETFDetails = (ticker) => {
    return {
      group: getETFGroup(ticker),
      nextDividend: getNextDividend(ticker),
    };
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <PortfolioContext.Provider
      value={{
        etfs,
        prices,
        loading,
        error,
        stats: calculateStats(),
        addETF,
        updateETF,
        deleteETF,
        addPurchase,
        validTickers,
        getDividendAmount,
        getETFDetails,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};

export default PortfolioContext;
