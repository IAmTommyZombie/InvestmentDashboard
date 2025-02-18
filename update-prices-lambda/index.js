const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const axios = require("axios");

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);
const YAHOO_API_KEY = process.env.YAHOO_API_KEY;

console.log("API Key length:", YAHOO_API_KEY ? YAHOO_API_KEY.length : 0);

async function updatePrice(ticker) {
  try {
    console.log("Making request for ticker:", ticker, {
      api_key_exists: !!YAHOO_API_KEY,
      api_key_length: YAHOO_API_KEY?.length,
    });

    if (!YAHOO_API_KEY) {
      throw new Error("YAHOO_API_KEY environment variable is not set");
    }

    // Basic plan specific configuration
    const response = await axios({
      method: "get",
      url: "https://yfapi.net/v6/finance/quote",
      params: {
        symbols: ticker,
        region: "US", // Explicitly set region
      },
      headers: {
        "x-api-key": YAHOO_API_KEY.trim(), // Ensure no whitespace
        Accept: "application/json",
      },
      timeout: 5000, // 5 second timeout
    });

    if (response.status === 200) {
      console.log(`Successfully fetched data for ${ticker}`);
      return response.data;
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request setup error:", error.message);
    }

    // Log the full configuration that was sent (excluding the full API key)
    console.error("Request Configuration:", {
      url: error.config?.url,
      params: error.config?.params,
      headers: {
        ...error.config?.headers,
        "x-api-key": YAHOO_API_KEY
          ? `${YAHOO_API_KEY.substring(0, 4)}...`
          : "not set",
      },
    });

    throw error;
  }
}

exports.handler = async (event) => {
  try {
    console.log("Starting price updates with event:", JSON.stringify(event));

    const portfoliosResponse = await docClient.send(
      new ScanCommand({
        TableName: "portfolios",
        ProjectionExpression: "ticker",
      })
    );

    const tickers = portfoliosResponse.Items.map((item) => item.ticker);
    console.log("Tickers to update:", tickers);

    const updates = await Promise.all(
      tickers.map((ticker) =>
        updatePrice(ticker).catch((error) => ({
          ticker,
          error: error.message,
          details: error.response?.data,
        }))
      )
    );

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          message: "Price update process completed",
          results: updates,
        },
        null,
        2
      ),
    };
  } catch (error) {
    console.error("Error in handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: "Error updating prices",
          error: error.message,
          details: error.response?.data,
        },
        null,
        2
      ),
    };
  }
};
