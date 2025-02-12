import { chromium } from "playwright";
import schedule from "node-schedule";
import { db } from "../config";
import { collection, doc, setDoc, Timestamp } from "firebase/firestore";
import { FALLBACK_PRICES } from "../constants/fallbackPrices";

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
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
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

export async function updatePrices() {
  console.log("Starting price update process...");
  try {
    const { results, errors } = await scrapePrices();
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

export function startScheduler() {
  console.log("Starting price update scheduler...");

  // Schedule for 4:01 PM ET on weekdays
  schedule.scheduleJob("1 16 * * 1-5", async () => {
    console.log("Running scheduled price update...");
    await updatePrices();
  });

  // Schedule for 9:31 AM ET on weekdays
  schedule.scheduleJob("31 9 * * 1-5", async () => {
    console.log("Running market open price update...");
    await updatePrices();
  });

  // Run initial update
  updatePrices();
}

// For running directly
if (require.main === module) {
  startScheduler();
}
