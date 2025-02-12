import { fetchDistributions } from "../scripts/scrapeDistributions";
import { updatePrices } from "../scripts/scrapePrices";

export async function updateData() {
  try {
    console.log("Starting data update...");
    await updatePrices();
    await fetchDistributions();
    console.log("Update complete!");
  } catch (error) {
    console.error("Update failed:", error);
  }
}
