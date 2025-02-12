import { db } from "../src/firebase/config.js";
import { collection, addDoc } from "firebase/firestore";

const setupFirebase = async () => {
  try {
    // Initial ETFs data
    const etfsData = [
      {
        ticker: "YMAG",
        totalShares: 100,
        group: "WEEKLY",
        purchaseDate: "2024-03-20",
      },
      {
        ticker: "CONY",
        totalShares: 200,
        group: "GROUP_C",
        purchaseDate: "2024-03-15",
      },
      // Add more ETFs as needed
    ];

    // Initial distributions data
    const distributionsData = [
      {
        ticker: "YMAG",
        year: 2024,
        month: 3,
        amount: 0.15,
      },
      {
        ticker: "CONY",
        year: 2024,
        month: 3,
        amount: 0.25,
      },
      // Add more distributions as needed
    ];

    // Add ETFs
    console.log("Adding ETFs...");
    for (const etf of etfsData) {
      await addDoc(collection(db, "etfs"), {
        ...etf,
        createdAt: new Date(),
      });
      console.log(`Added ETF: ${etf.ticker}`);
    }

    // Add distributions
    console.log("\nAdding distributions...");
    for (const dist of distributionsData) {
      await addDoc(collection(db, "distributions"), {
        ...dist,
        updatedAt: new Date(),
      });
      console.log(`Added distribution for: ${dist.ticker}`);
    }

    console.log("\nSetup complete!");
  } catch (error) {
    console.error("Error during setup:", error);
  }
};

// Run the setup
setupFirebase();
