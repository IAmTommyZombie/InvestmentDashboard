/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { chromium } = require("playwright");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore();

// Price update function
async function updatePrices() {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // List of ETFs to update
    const etfs = [
      "YMAG",
      "YMAX",
      "LFGY",
      "GPTY", // WEEKLY
      "TSLY",
      "GOOY",
      "YBIT",
      "OARK", // GROUP A
      "NVDY",
      "FBY",
      "GDXY",
      "JPMO", // GROUP B
      "CONY",
      "MSFO",
      "AMDY",
      "NFLY", // GROUP C
      "MSTY",
      "AMZY",
      "APLY",
      "DISO", // GROUP D
    ];

    for (const ticker of etfs) {
      try {
        // Navigate to Yahoo Finance
        await page.goto(`https://finance.yahoo.com/quote/${ticker}`);

        // Wait for price element
        const priceElement = await page.waitForSelector(
          '[data-test="qsp-price"]'
        );
        const price = await priceElement.textContent();

        // Update price in Firebase
        await db
          .collection("prices")
          .doc(ticker)
          .set({
            currentPrice: parseFloat(price),
            lastUpdated: new Date().toISOString(),
            source: "yahoo",
          });

        console.log(`Updated ${ticker}: $${price}`);

        // Wait between requests to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error updating ${ticker}:`, error);
      }
    }
  } finally {
    await browser.close();
  }
}

// Schedule updates for market open (9:31 AM ET) and close (4:01 PM ET)
exports.scheduledPriceUpdates = functions.pubsub
  .schedule("31 9,16 * * 1-5")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    console.log("Starting scheduled price update...");
    await updatePrices();
    return null;
  });

// Manual trigger endpoint
exports.manualPriceUpdate = functions.https.onRequest(async (req, res) => {
  try {
    console.log("Starting manual price update...");
    await updatePrices();
    res.json({ success: true, message: "Prices updated successfully" });
  } catch (error) {
    console.error("Manual update failed:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});
