const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase with service account from GitHub secrets
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function fetchPrice(symbol) {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`
    );
    return response.data.chart.result[0].meta.regularMarketPrice;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error);
    return null;
  }
}

async function updatePrices() {
  const etfs = [
    // Weekly Group
    "YMAG",
    "YMAX",
    "LFGY",
    "GPTY",
    // Group A
    "TSLY",
    "GOOY",
    "YBIT",
    "OARK",
    "XOMO",
    "TSMY",
    "CRSH",
    "FIVY",
    "FEAT",
    // Group B
    "NVDY",
    "FBY",
    "GDXY",
    "JPMO",
    "MRNY",
    "MARO",
    "PLTY",
    // Group C
    "CONY",
    "MSFO",
    "AMDY",
    "NFLY",
    "PYPY",
    "ULTY",
    "ABNY",
    // Group D
    "MSTY",
    "AMZY",
    "APLY",
    "DISO",
    "SQY",
    "SMCY",
    "AIYY",
  ];

  for (const symbol of etfs) {
    const price = await fetchPrice(symbol);
    if (price) {
      await db.collection("etfs").doc(symbol).set({
        price,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Updated ${symbol}: $${price}`);
    }
  }
}

updatePrices()
  .then(() => {
    console.log("All prices updated");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
