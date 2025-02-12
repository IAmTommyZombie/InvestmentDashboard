// src/context/PortfolioContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, query } from "firebase/firestore";
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

  // Replace fetchEtfs with Firebase listener
  useEffect(() => {
    try {
      const etfsRef = collection(db, "etfs");
      const q = query(etfsRef);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const etfsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("Firebase ETFs:", etfsData);
        setEtfs(etfsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching ETFs from Firebase:", error);
      setError("Failed to fetch portfolio data");
      setLoading(false);
    }
  }, []);

  // Replace fetchPrices with Firebase listener
  useEffect(() => {
    try {
      const pricesRef = collection(db, "prices");
      const unsubscribe = onSnapshot(pricesRef, (snapshot) => {
        const pricesData = {};
        snapshot.forEach((doc) => {
          pricesData[doc.id] = doc.data().currentPrice;
        });
        setPrices(pricesData);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error fetching prices from Firebase:", error);
    }
  }, []);

  // Update calculateStats to use Firebase data structure
  const calculateStats = () => {
    const totalValue = etfs.reduce(
      (sum, etf) => sum + (etf.totalShares || 0) * (etf.currentPrice || 0),
      0
    );

    const monthlyIncome = etfs.reduce(
      (sum, etf) => sum + (etf.totalShares || 0) * (etf.distribution || 0),
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
      return sum + (etf.totalShares || 0) * (etf.costBasis || 0);
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

  // Update other methods to use Firebase
  const addETF = async (etfData) => {
    // Implementation using Firebase
  };

  const updateETF = async (id, updatedData) => {
    // Implementation using Firebase
  };

  const deleteETF = async (id) => {
    // Implementation using Firebase
  };

  const addPurchase = async (id, purchaseData) => {
    // Implementation using Firebase
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
