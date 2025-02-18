/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require("firebase-functions");
const fetch = require("node-fetch");
const cors = require("cors")({ origin: true });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.scrapePrices = functions.https.onRequest((request, response) => {
  cors(request, response, async () => {
    try {
      const { ticker } = request.body;

      // Call the scraper service
      const scraperResponse = await fetch(
        "https://investment-dashboard-scraper.onrender.com/scrape-price",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ticker }),
        }
      );

      const data = await scraperResponse.json();
      response.json(data);
    } catch (error) {
      console.error("Error in scrapePrices:", error);
      response.status(500).json({ error: error.message });
    }
  });
});
