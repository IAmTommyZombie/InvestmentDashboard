import { db } from "../config";
import { doc, updateDoc, collection } from "firebase/firestore";
import axios from "axios";

// ETF list - consider moving this to a separate config file
const ETFs = [
  // WEEKLY
  "YMAG",
  "YMAX",
  "LFGY",
  "GPTY",
  // GROUP A
  "TSLY",
  "GOOY",
  "YBIT",
  "OARK",
  "XOMO",
  "TSMY",
  "CRSH",
  "FIVY",
  "FEAT",
  // GROUP B
  "NVDY",
  "FBY",
  "GDXY",
  "JPMO",
  "MRNY",
  "MARO",
  "PLTY",
  // GROUP C
  "CONY",
  "MSFO",
  "AMDY",
  "NFLY",
  "PYPY",
  "ULTY",
  "ABNY",
  // GROUP D
  "MSTY",
  "AMZY",
  "APLY",
  "DISO",
  "SQY",
  "SMCY",
  "AIYY",
];

export async function fetchDistributions() {
  console.log("Starting distribution fetching...");

  for (const ticker of ETFs) {
    try {
      console.log(`Fetching distributions for ${ticker}...`);

      const response = await axios.get(
        `https://www.cefconnect.com/api/v3/funds/${ticker}/distribution-history`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        }
      );

      if (!response.data) {
        console.warn(`No data received for ${ticker}`);
        continue;
      }

      // Update Firebase
      const distributionRef = doc(collection(db, "distributions"), ticker);
      await updateDoc(distributionRef, {
        history: response.data,
        lastUpdated: new Date().toISOString(),
      });

      console.log(`✓ Updated ${ticker}`);

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error fetching ${ticker}:`, error.message);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    }
  }

  console.log("Distribution fetching complete!");
}

// For running directly
if (require.main === module) {
  fetchDistributions()
    .then(() => {
      console.log("All done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Fetching failed:", error);
      process.exit(1);
    });
}
