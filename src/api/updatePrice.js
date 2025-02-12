import { chromium } from "playwright";

export async function updatePrice(ticker) {
  let browser = null;

  try {
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`https://finance.yahoo.com/quote/${ticker}/history/`);
    await page.waitForSelector('[data-test="historical-prices"]', {
      timeout: 10000,
    });

    const priceElement = await page
      .locator('fin-streamer[data-field="regularMarketPrice"]')
      .first();
    const price = await priceElement.getAttribute("value");

    return parseFloat(price);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
