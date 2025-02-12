import { db } from "../src/firebase/config.js";
import { collection, addDoc } from "firebase/firestore";
import { DISTRIBUTIONS } from "../src/data/distributions.js";

const migrateData = async () => {
  try {
    const etfsRef = collection(db, "etfs");

    // Your existing ETF data structure
    const etfsToMigrate = [
      {
        ticker: "CONY",
        group: "GROUP_C",
        totalShares: 600,
        purchaseDate: "2025-01-01",
      },
      // Add more ETFs here from your current data
    ];

    // Add each ETF to Firestore
    for (const etf of etfsToMigrate) {
      await addDoc(etfsRef, {
        ...etf,
        createdAt: new Date(),
        distributions: DISTRIBUTIONS[etf.ticker] || {},
      });
      console.log(`Migrated ${etf.ticker}`);
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

// Run the migration
migrateData();
