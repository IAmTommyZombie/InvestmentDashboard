const { initializeApp } = require("firebase/app");
const { getFirestore, collection, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCBZLT3rgxVorNPu5iKdGDV4QL1JBKidZA",
  authDomain: "investment-dashboard-77e78.firebaseapp.com",
  projectId: "investment-dashboard-77e78",
  storageBucket: "investment-dashboard-77e78.firebasestorage.app",
  messagingSenderId: "412792088409",
  appId: "1:412792088409:web:cf4317d151df3211d64e48",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your distribution data
const distributions = {
  JEPI: {
    2024: {
      1: 0.5678,
      2: 0.5456,
      // ... add more months
    },
  },
  // ... add more ETFs
};

// Structure will be:
// distributions/{ticker}/history/{year}/{month}
async function migrateDistributions() {
  console.log("Starting distribution migration...");

  for (const [ticker, data] of Object.entries(distributions)) {
    try {
      console.log(`Migrating distributions for ${ticker}...`);

      const distributionRef = doc(collection(db, "distributions"), ticker);
      await setDoc(distributionRef, {
        ticker,
        frequency: data.frequency,
        history: data.history,
      });

      console.log(`✓ Migrated ${ticker}`);
    } catch (error) {
      console.error(`Error migrating ${ticker}:`, error);
    }
  }

  console.log("Distribution migration complete!");
}

migrateDistributions()
  .then(() => {
    console.log("All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
