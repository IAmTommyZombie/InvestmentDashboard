import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { awsConfig } from "../config/aws-config";

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

// ETF Operations
export const getEtfPrice = async (ticker) => {
  try {
    const command = new GetCommand({
      TableName: "etfs",
      Key: { ticker },
    });
    const response = await docClient.send(command);
    return response.Item;
  } catch (error) {
    console.error("Error getting ETF price:", error);
    throw error;
  }
};

export const updateEtfPrice = async (ticker, price) => {
  try {
    const command = new PutCommand({
      TableName: "etfs",
      Item: {
        ticker,
        currentPrice: price,
        lastUpdated: new Date().toISOString(),
      },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error("Error updating ETF price:", error);
    throw error;
  }
};

// Portfolio Operations
export const getPortfolios = async () => {
  try {
    const command = new ScanCommand({
      TableName: "portfolios",
    });
    const response = await docClient.send(command);
    return response.Items || [];
  } catch (error) {
    console.error("Error getting portfolios:", error);
    throw error;
  }
};

export const updatePortfolio = async (userId, ticker, shares, averageCost) => {
  try {
    const command = new PutCommand({
      TableName: "portfolios",
      Item: {
        userId,
        ticker,
        totalShares: shares,
        averageCost,
      },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error("Error updating portfolio:", error);
    throw error;
  }
};

// Distribution Operations
export const getDistributions = async () => {
  try {
    const command = new ScanCommand({
      TableName: "distributions",
    });
    const response = await docClient.send(command);

    const distData = {};
    response.Items.forEach((item) => {
      distData[item.ticker] = {
        history: item.history || {},
        lastUpdated: item.lastUpdated || new Date().toISOString(),
        ticker: item.ticker,
      };
    });
    return distData;
  } catch (error) {
    console.error("Error getting distributions:", error);
    throw error;
  }
};

export const addDistribution = async (ticker, date, amount) => {
  try {
    const command = new PutCommand({
      TableName: "distributions",
      Item: {
        ticker,
        date: date.toISOString(),
        amount,
      },
    });
    await docClient.send(command);
    return true;
  } catch (error) {
    console.error("Error adding distribution:", error);
    throw error;
  }
};

// Price operations (from a separate prices table)
export const getPrices = async () => {
  try {
    const command = new ScanCommand({
      TableName: "prices",
    });
    const response = await docClient.send(command);

    const priceData = {};
    response.Items.forEach((item) => {
      priceData[item.ticker] = {
        currentPrice: Number(item.currentPrice || 0),
        lastUpdated: item.lastUpdated || new Date().toISOString(),
        source: item.source || "dynamodb",
        ticker: item.ticker,
      };
    });

    return priceData;
  } catch (error) {
    console.error("Error getting prices:", error);
    throw error;
  }
};

export const deleteEtf = async (etfId) => {
  try {
    const command = new DeleteCommand({
      TableName: "etfs",
      Key: {
        ticker: etfId,
      },
    });
    await docClient.send(command);
  } catch (error) {
    console.error("Error deleting ETF:", error);
    throw error;
  }
};
