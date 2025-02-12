import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";

const DistributionContext = createContext();

const WEEKLY_ETFS = ["YMAG", "YMAX", "LFGY", "GPTY"];
const THIRTEEN_X_ETFS = [
  "TSLY",
  "GOOY",
  "YBIT",
  "OARK",
  "XOMO",
  "TSMY",
  "CRSH",
  "FIVY",
  "FEAT",
  "NVDY",
  "FBY",
  "GDXY",
  "JPMO",
  "MRNY",
  "MARO",
  "PLTY",
  "CONY",
  "MSFO",
  "AMDY",
  "NFLY",
  "PYPY",
  "ULTY",
  "ABNY",
  "MSTY",
  "AMZY",
  "APLY",
  "DISO",
  "SQY",
  "SMCY",
  "AIYY",
];

export const DistributionProvider = ({ children }) => {
  const [distributions, setDistributions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "distributions"),
      (snapshot) => {
        const data = {};
        snapshot.forEach((doc) => {
          data[doc.id] = doc.data();
        });
        setDistributions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching distributions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const getPaymentsPerYear = (ticker) => {
    if (WEEKLY_ETFS.includes(ticker)) return 52;
    if (THIRTEEN_X_ETFS.includes(ticker)) return 13;
    return 12; // default to monthly
  };

  const getLatestDistribution = (ticker) => {
    const distribution = distributions[ticker];
    if (!distribution?.history) return "N/A";

    const years = Object.keys(distribution.history).sort().reverse();
    if (years.length === 0) return "N/A";

    const latestYear = years[0];
    const months = Object.keys(distribution.history[latestYear]).sort(
      (a, b) => b - a
    );

    if (months.length === 0) return "N/A";

    const latestMonth = months[0];
    const value = distribution.history[latestYear][latestMonth];

    return value === "TBD" ? "TBD" : value;
  };

  return (
    <DistributionContext.Provider
      value={{
        distributions,
        loading,
        getLatestDistribution,
        getPaymentsPerYear,
      }}
    >
      {children}
    </DistributionContext.Provider>
  );
};

export const useDistributions = () => useContext(DistributionContext);
