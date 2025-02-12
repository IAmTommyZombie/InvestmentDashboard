const { chromium } = require("playwright");
const schedule = require("node-schedule");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} = require("firebase/firestore");
const { FALLBACK_PRICES } = require("../config/fallbackPrices");
require("dotenv").config();

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCBZLT3rgxVorNPu5iKdGDV4QL1JBKidZA",
  authDomain: "investment-dashboard-77e78.firebaseapp.com",
  projectId: "investment-dashboard-77e78",
  storageBucket: "investment-dashboard-77e78.firebasestorage.app",
  messagingSenderId: "412792088409",
  appId: "1:412792088409:web:cf4317d151df3211d64e48",
};

// Initialize Firebase
console.log("Initializing Firebase...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Initializing Firebase with config:", {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
});

// After initializing Firebase
console.log("Firebase initialized, database instance created");

async function setupBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });
}

async function getPrice(page, ticker) {
  const yahooUrl = `https://finance.yahoo.com/quote/${ticker}/history/`;

  try {
    await page.setDefaultTimeout(60000);
    await page.setDefaultNavigationTimeout(60000);

    await page.setExtraHTTPHeaders({
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      Connection: "keep-alive",
    });

    console.log(`Navigating to ${yahooUrl}`);
    await page.goto(yahooUrl, { waitUntil: "domcontentloaded" });

    console.log(`Waiting for price element for ${ticker}`);
    const priceElement = await page.waitForSelector(
      '[data-testid="qsp-price"]',
      {
        timeout: 10000,
      }
    );

    if (!priceElement) {
      throw new Error("Price element not found");
    }

    const priceText = await priceElement.textContent();
    const price = parseFloat(priceText.replace(/[^0-9.]/g, ""));

    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price: ${priceText}`);
    }

    console.log(`Successfully found price for ${ticker}: $${price}`);
    return { price, source: "yahoo" };
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error.message);
    return {
      price: FALLBACK_PRICES[ticker].price,
      source: "fallback",
    };
  }
}

async function scrapePrices() {
  console.log("Starting price scraping...");
  let browser;

  try {
    browser = await setupBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];
    const errors = [];
    const tickers = Object.keys(FALLBACK_PRICES);

    const BATCH_SIZE = 5;
    for (let i = 0; i < tickers.length; i += BATCH_SIZE) {
      const batch = tickers.slice(i, i + BATCH_SIZE);

      for (const ticker of batch) {
        try {
          console.log(`Processing ${ticker}...`);
          const { price, source } = await getPrice(page, ticker);

          results.push({
            ticker,
            price,
            timestamp: Timestamp.now(),
            source,
          });
        } catch (error) {
          console.error(`Failed to process ${ticker}:`, error);
          errors.push({ ticker, error: error.message });

          results.push({
            ticker,
            price: FALLBACK_PRICES[ticker].price,
            timestamp: Timestamp.now(),
            source: "fallback",
          });
        }

        await page.waitForTimeout(2000);
      }

      if (i + BATCH_SIZE < tickers.length) {
        console.log("Waiting between batches...");
        await page.waitForTimeout(5000);
      }
    }

    return { results, errors };
  } catch (error) {
    console.error("Fatal scraping error:", error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("Browser closed");
    }
  }
}

async function savePricesToFirebase(prices) {
  console.log(`\nSaving ${prices.length} prices to Firebase...`);

  for (const priceData of prices) {
    try {
      console.log(`Saving ${priceData.ticker} at $${priceData.price}...`);

      const priceRef = doc(collection(db, "prices"), priceData.ticker);
      await setDoc(priceRef, {
        currentPrice: priceData.price,
        lastUpdated: priceData.timestamp,
        source: priceData.source,
        ticker: priceData.ticker,
      });

      console.log(`✓ Saved ${priceData.ticker}`);
    } catch (error) {
      console.error(`Error saving ${priceData.ticker}:`, error);
    }
  }
}

async function updatePrices() {
  console.log("Starting price update process...");
  try {
    const { results, errors } = await scrapePrices();
    console.log(
      "Prices scraped, attempting to save to Firebase:",
      results.length,
      "items"
    );
    await savePricesToFirebase(results);

    console.log("\n=== Price Update Summary ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Total prices updated: ${results.length}`);
    console.log(`Failed updates: ${errors.length}`);
    console.log("\nSuccessful updates:");
    results.forEach((r) =>
      console.log(`${r.ticker}: $${r.price} (${r.source})`)
    );

    if (errors.length > 0) {
      console.log("\nErrors:");
      errors.forEach((e) => console.log(`${e.ticker}: ${e.error}`));
    }
  } catch (error) {
    console.error("Update process failed:", error);
  }
}

function startScheduler() {
  console.log("Starting price update scheduler...");

  // Schedule for 4:01 PM ET on weekdays
  const marketCloseJob = schedule.scheduleJob("1 16 * * 1-5", async () => {
    console.log("Running scheduled price update...");
    try {
      await updatePrices();
      console.log("Scheduled update completed successfully");
    } catch (error) {
      console.error("Scheduled update failed:", error);
    }
  });

  // Schedule for 9:31 AM ET on weekdays
  const marketOpenJob = schedule.scheduleJob("31 9 * * 1-5", async () => {
    console.log("Running market open price update...");
    try {
      await updatePrices();
      console.log("Market open update completed successfully");
    } catch (error) {
      console.error("Market open update failed:", error);
    }
  });

  // Run initial update
  console.log("Running initial price update...");
  updatePrices();

  return { marketCloseJob, marketOpenJob };
}

if (require.main === module) {
  startScheduler();
}

module.exports = {
  scrapePrices,
  savePricesToFirebase,
  updatePrices,
  startScheduler,
};
