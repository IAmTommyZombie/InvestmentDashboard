import { fetchDistributions } from "./scrapeDistributions.js";
import { updatePrices } from "./scrapePrices.js";
import schedule from "node-schedule";

async function updateAll() {
  console.log("\n=== Starting Full Update Process ===");
  console.log(`Time: ${new Date().toLocaleString()}`);

  try {
    // Update prices first
    console.log("\n--- Updating Prices ---");
    await updatePrices();

    // Add a small delay between operations
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Then update distributions
    console.log("\n--- Updating Distributions ---");
    await fetchDistributions();

    console.log("\n=== Update Process Complete ===");
    console.log(`Finished at: ${new Date().toLocaleString()}`);
  } catch (error) {
    console.error("\n=== Update Process Failed ===");
    console.error("Error:", error);
  }
}

function startScheduler() {
  console.log("Starting combined update scheduler...");

  // Run at market close (4:01 PM ET) on weekdays
  schedule.scheduleJob("1 16 * * 1-5", async () => {
    console.log("Running scheduled market close update...");
    await updateAll();
  });

  // Run at market open (9:31 AM ET) on weekdays
  schedule.scheduleJob("31 9 * * 1-5", async () => {
    console.log("Running scheduled market open update...");
    await updateAll();
  });

  // Run once on weekend (Sunday at 12:00 PM ET) for distribution updates
  schedule.scheduleJob("0 12 * * 0", async () => {
    console.log("Running weekend distribution update...");
    await fetchDistributions();
  });

  // Run initial update
  updateAll();
}

// For running directly
if (require.main === module) {
  startScheduler();
}

export { updateAll, startScheduler };
