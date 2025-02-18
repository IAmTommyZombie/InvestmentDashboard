import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { awsConfig } from "../config/aws-config";

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

export const updatePrice = async (ticker) => {
  try {
    // Option 1: Yahoo Finance API (need API key)
    const response = await axios.get(`https://yfapi.net/v6/finance/quote`, {
      params: { symbols: ticker },
      headers: { "x-api-key": w7ZGuRneyW6TNeFbtn7Jd9rfyYWbPAII1Z847z7X },
    });

    // Option 2: Alpha Vantage (free tier available)
    // const response = await axios.get(`https://www.alphavantage.co/query`, {
    //     params: {
    //         function: 'GLOBAL_QUOTE',
    //         symbol: ticker,
    //         apikey: 'YOUR_ALPHA_VANTAGE_API_KEY'
    //     }
    // });

    const price = response.data.quoteResponse.result[0].regularMarketPrice;

    // Update DynamoDB
    await docClient.send(
      new PutCommand({
        TableName: "prices",
        Item: {
          ticker,
          currentPrice: price,
          lastUpdated: new Date().toISOString(),
          source: "yahoo", // or "alphavantage"
        },
      })
    );

    return price;
  } catch (error) {
    console.error(`Error updating price for ${ticker}:`, error);
    throw error;
  }
};
