import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db } from "../firebase/config.js";
import { collection, getDocs } from "firebase/firestore";

const client = new DynamoDBClient({
  region: "us-east-2",
});
const docClient = DynamoDBDocumentClient.from(client);

export const migrateData = async () => {
  try {
    // First, verify Firebase connection
    console.log("Verifying Firebase connection...");
    if (!db) {
      throw new Error("Firebase db not initialized");
    }
    console.log("✅ Firebase connected");

    // Migrate ETFs
    console.log("\nMigrating ETFs...");
    const etfsSnapshot = await getDocs(collection(db, "prices"));
    for (const doc of etfsSnapshot.docs) {
      const etfData = doc.data();
      const etfItem = {
        ticker: doc.id,
        currentPrice: etfData.currentPrice || 0,
        lastUpdated:
          etfData.lastUpdated?.toDate?.()?.toISOString() ||
          new Date().toISOString(),
      };

      await docClient.send(
        new PutCommand({
          TableName: "etfs",
          Item: etfItem,
        })
      );
      console.log(`✅ Migrated ETF: ${doc.id}`);
    }

    // Migrate Portfolios
    console.log("\nMigrating Portfolios...");
    const portfoliosSnapshot = await getDocs(collection(db, "portfolios"));
    for (const doc of portfoliosSnapshot.docs) {
      const portfolioData = doc.data();
      const [userId, ticker] = doc.id.split("_");

      const portfolioItem = {
        userId,
        ticker,
        totalShares: portfolioData.totalShares || 0,
        averageCost: portfolioData.averageCost || 0,
      };

      await docClient.send(
        new PutCommand({
          TableName: "portfolios",
          Item: portfolioItem,
        })
      );
      console.log(`✅ Migrated Portfolio: ${doc.id}`);
    }

    // Migrate Distributions
    console.log("\nMigrating Distributions...");
    const distributionsSnapshot = await getDocs(
      collection(db, "distributions")
    );
    for (const doc of distributionsSnapshot.docs) {
      const distData = doc.data();
      const distributionItem = {
        ticker: distData.ticker,
        date:
          distData.date?.toDate?.()?.toISOString() || new Date().toISOString(),
        amount: distData.amount || 0,
      };

      await docClient.send(
        new PutCommand({
          TableName: "distributions",
          Item: distributionItem,
        })
      );
      console.log(`✅ Migrated Distribution: ${doc.id}`);
    }

    console.log("\n✅ Migration completed successfully!");
    return true;
  } catch (error) {
    console.error("Migration error:", error);
    return false;
  }
};
