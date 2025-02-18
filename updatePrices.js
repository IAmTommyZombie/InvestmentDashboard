const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");
const axios = require("axios");

const client = new DynamoDBClient({ region: "us-east-2" });
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // Get all tickers from portfolios table
    const portfoliosResponse = await docClient.send(
      new ScanCommand({
        TableName: "portfolios",
        ProjectionExpression: "ticker",
      })
    );

    const tickers = portfoliosResponse.Items.map((item) => item.ticker);

    // Update each ticker's price
    for (const ticker of tickers) {
      await updatePrice(ticker);
    }

    return {
      statusCode: 200,
      body: JSON.stringify("Prices updated successfully"),
    };
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
