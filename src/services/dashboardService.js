import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { awsConfig } from "../config/aws-config";

const client = new DynamoDBClient(awsConfig);
const docClient = DynamoDBDocumentClient.from(client);

export const getDashboardData = async () => {
  try {
    // Get data from all three tables
    const [etfsResponse, portfoliosResponse, distributionsResponse] =
      await Promise.all([
        docClient.send(new ScanCommand({ TableName: "etfs" })),
        docClient.send(new ScanCommand({ TableName: "portfolios" })),
        docClient.send(new ScanCommand({ TableName: "distributions" })),
      ]);

    console.log("Raw responses:", {
      etfs: etfsResponse,
      portfolios: portfoliosResponse,
      distributions: distributionsResponse,
    });

    return {
      etfs: etfsResponse.Items || [],
      prices: portfoliosResponse.Items || [], // Changed from prices to portfolios
      distributions: distributionsResponse.Items || [],
    };
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
    });
    throw error;
  }
};
