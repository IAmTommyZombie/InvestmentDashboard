import { migrateData } from "./migrateData.js";

const runMigration = async () => {
  console.log("Starting data migration...");

  try {
    const success = await migrateData();
    if (success) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n❌ Migration failed. Check the error messages above.");
    }
  } catch (error) {
    console.error("\n❌ Migration failed with error:", error);
  }
};

runMigration();
