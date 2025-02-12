const axios = require("axios");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  updateDoc,
  collection,
} = require("firebase/firestore");

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

async function fetchDistributions() {
  console.log("Starting distribution fetching...");

  const ETFs = ["YMAG", "YMAX", "TSLY", "APLY"];

  for (const ticker of ETFs) {
    try {
      console.log(`Fetching distributions for ${ticker}...`);
      
      // Fetch from CEFConnect
      const response = await axios.get(
        `https://www.cefconnect.com/api/v3/funds/${ticker}/distribution-history`,
        {
          headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
          }
        }
      );

      console.log(`Response for ${ticker}:`, response.data);

      // Update Firebase
      const distributionRef = doc(collection(db, "distributions"), ticker);
      await updateDoc(distributionRef, {
        history: response.data
      });

      console.log(`✓ Updated ${ticker}`);
    } catch (error) {
      console.error(`Error fetching ${ticker}:`, error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  }

  console.log("Distribution fetching complete!");
}

// Run the fetcher
fetchDistributions()
  .then(() => {
    console.log("All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fetching failed:", error);
    process.exit(1);
  });
