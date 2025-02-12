const { chromium } = require("playwright");
const schedule = require("node-schedule");
const { initializeApp, getApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} = require("firebase/firestore");
const { FALLBACK_PRICES } = require("../config/fallbackPrices");
require("dotenv").config();
const puppeteer = require("puppeteer");
const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin with the service account
const serviceAccount = require("../service-account-key.json");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "investment-dashboard-77e78",
  });
}

const db = admin.firestore();

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
const dbFirebase = getFirestore(app);

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
  console.log(`Processing ${ticker}...`);
  const yahooUrl = `https://finance.yahoo.com/quote/${ticker}/`;

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

      const priceRef = doc(collection(dbFirebase, "prices"), priceData.ticker);
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
  let browser = null;

  // Set status in Firebase as running
  try {
    await setDoc(doc(dbFirebase, "status", "updateStatus"), {
      status: "running",
      startTime: Timestamp.now(),
    });
  } catch (error) {
    console.error("Failed to set initial status:", error);
  }

  try {
    browser = await setupBrowser();
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];
    const errors = [];
    const tickers = Object.keys(FALLBACK_PRICES);

    console.log(`Starting to process ${tickers.length} tickers...`);

    for (const ticker of tickers) {
      try {
        console.log(`Processing ${ticker}...`);
        const { price, source } = await getPrice(page, ticker);

        // Save to Firebase
        const priceRef = doc(collection(dbFirebase, "prices"), ticker);
        await setDoc(priceRef, {
          currentPrice: price,
          lastUpdated: Timestamp.now(),
          source: source,
          ticker: ticker,
        });

        console.log(`✓ Saved ${ticker}: $${price}`);
        results.push({ ticker, price, source });
      } catch (error) {
        console.error(`Failed to process ${ticker}:`, error);
        errors.push({ ticker, error: error.message });

        // Save fallback price
        const fallbackPrice = FALLBACK_PRICES[ticker].price;
        const priceRef = doc(collection(dbFirebase, "prices"), ticker);
        await setDoc(priceRef, {
          currentPrice: fallbackPrice,
          lastUpdated: Timestamp.now(),
          source: "fallback",
          ticker: ticker,
        });
      }
      await page.waitForTimeout(1000);
    }

    // Update completion status in Firebase
    await setDoc(doc(dbFirebase, "status", "updateStatus"), {
      status: "completed",
      endTime: Timestamp.now(),
      totalUpdated: results.length,
      errors: errors.length,
    });

    console.log("\n=== Update Complete ===");
    console.log(`Total updated: ${results.length}`);
    console.log(`Errors: ${errors.length}`);
  } catch (error) {
    console.error("Fatal error:", error);
    // Update error status in Firebase
    await setDoc(doc(dbFirebase, "status", "updateStatus"), {
      status: "error",
      endTime: Timestamp.now(),
      error: error.message,
    });
  } finally {
    if (browser) {
      await browser.close();
    }
    process.exit(0);
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

async function scrapePriceForTicker(ticker) {
  console.log(`\n=== Starting to scrape price for ${ticker} ===`);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    const url = `https://finance.yahoo.com/quote/${ticker}`;
    console.log(`Navigating to: ${url}`);

    await page.goto(url);

    // Use the new waitForSelector with XPath
    await page.waitForSelector('[data-testid="qsp-price"]', {
      timeout: 10000,
    });

    // Get the price using the new selector method
    const priceElement = await page.$('[data-testid="qsp-price"]');
    if (!priceElement) {
      throw new Error(`Could not find price element for ${ticker}`);
    }

    const price = await page.evaluate((el) => el.textContent, priceElement);
    console.log(`Found raw price for ${ticker}: ${price}`);

    if (!price) {
      throw new Error(`Could not find price for ${ticker}`);
    }

    const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ""));

    if (isNaN(numericPrice)) {
      throw new Error(`Invalid price format for ${ticker}: ${price}`);
    }

    console.log(`Parsed price for ${ticker}: $${numericPrice}`);

    // Update Firestore
    await db.collection("prices").doc(ticker).set({
      currentPrice: numericPrice,
      lastUpdated: admin.firestore.Timestamp.now(),
      source: "yahoo",
      ticker: ticker,
    });

    console.log(`Successfully saved to Firestore:`);
    console.log(`- Ticker: ${ticker}`);
    console.log(`- Price: $${numericPrice}`);
    console.log(`=== Completed ${ticker} ===\n`);

    return {
      ticker,
      price: numericPrice,
    };
  } catch (error) {
    console.error(`!!! Error scraping ${ticker}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

// If running directly (not imported)
if (require.main === module) {
  console.log("Running price update...");
  updatePrices().catch((error) => {
    console.error("Fatal error in main:", error);
    process.exit(1);
  });
}

module.exports = {
  scrapePrices,
  savePricesToFirebase,
  updatePrices,
  startScheduler,
  scrapePriceForTicker,
};
