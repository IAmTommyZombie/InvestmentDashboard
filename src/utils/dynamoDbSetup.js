import {
  DynamoDBClient,
  ListTablesCommand,
  CreateTableCommand,
  DeleteTableCommand,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "us-east-2", // Updated to correct region
});
const docClient = DynamoDBDocumentClient.from(client);

// Sample ETF data
const sampleEtfs = [
  {
    ticker: "YMAG",
    price: 18.0,
    lastUpdated: new Date().toISOString(),
  },
  {
    ticker: "YMAX",
    price: 16.49,
    lastUpdated: new Date().toISOString(),
  },
  // Add a few more for testing
];

// Function to add ETF to DynamoDB
const addEtf = async (etf) => {
  const command = new PutCommand({
    TableName: "etfs",
    Item: etf,
  });

  try {
    await docClient.send(command);
    console.log(`Successfully added ${etf.ticker}`);
  } catch (error) {
    console.error(`Error adding ${etf.ticker}:`, error);
  }
};

// Test function to add all ETFs
const populateEtfs = async () => {
  for (const etf of sampleEtfs) {
    await addEtf(etf);
  }
};

const createTable = async (tableName, partitionKey, sortKey = null) => {
  const keySchema = [{ AttributeName: partitionKey, KeyType: "HASH" }];

  if (sortKey) {
    keySchema.push({ AttributeName: sortKey, KeyType: "RANGE" });
  }

  const attributeDefinitions = [
    { AttributeName: partitionKey, AttributeType: "S" },
  ];

  if (sortKey) {
    attributeDefinitions.push({ AttributeName: sortKey, AttributeType: "S" });
  }

  const command = new CreateTableCommand({
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    BillingMode: "PAY_PER_REQUEST",
  });

  try {
    const response = await client.send(command);
    console.log(`✅ Created table ${tableName}`);
    return response;
  } catch (error) {
    console.error(`❌ Error creating table ${tableName}:`, error);
    throw error;
  }
};

export const setupTables = async () => {
  try {
    // First, list existing tables
    const listCommand = new ListTablesCommand({});
    const { TableNames } = await client.send(listCommand);
    console.log("Current tables:", TableNames);

    // Create tables with correct schemas
    console.log("\nCreating tables...");

    // ETFs table
    await createTable("etfs", "ticker");

    // Portfolios table (with composite key)
    await createTable("portfolios", "userId", "ticker");

    // Distributions table (with composite key)
    await createTable("distributions", "ticker", "date");

    console.log("\n✅ All tables created successfully!");
    return true;
  } catch (error) {
    console.error("Error setting up tables:", error);
    return false;
  }
};

// Test function to verify connection
export const testConnection = async () => {
  try {
    // First, list all tables
    const listCommand = new ListTablesCommand({});
    const listResponse = await client.send(listCommand);
    console.log("Available tables:", listResponse.TableNames);

    // Test etfs table
    console.log("\nTesting etfs table...");
    const etfItem = {
      "ticker ": "TEST-ETF",
      price: 100,
      name: "Test ETF",
      lastUpdated: new Date().toISOString(),
    };
    await docClient.send(
      new PutCommand({
        TableName: "etfs",
        Item: etfItem,
      })
    );
    console.log("✅ Successfully wrote to etfs table");

    // Test portfolios table
    console.log("\nTesting portfolios table...");
    const portfolioItem = {
      "userId ": "test-user", // Note: Check if this also has a space
      ticker: "TEST-ETF",
      totalShares: 100,
    };
    await docClient.send(
      new PutCommand({
        TableName: "portfolios",
        Item: portfolioItem,
      })
    );
    console.log("✅ Successfully wrote to portfolios table");

    // Test distributions table
    console.log("\nTesting distributions table...");
    const distributionItem = {
      "ticker ": "TEST-ETF", // Note: Check if this also has a space
      amount: 0.5,
      date: new Date().toISOString(),
    };
    await docClient.send(
      new PutCommand({
        TableName: "distributions",
        Item: distributionItem,
      })
    );
    console.log("✅ Successfully wrote to distributions table");

    return true;
  } catch (error) {
    console.error("Error:", error);
    console.error("Error details:", error.message);
    return false;
  }
};

// Export for testing
export { populateEtfs };

export const testTables = async () => {
  try {
    // Test etfs table
    console.log("\nTesting etfs table...");
    const etfItem = {
      ticker: "TEST-ETF", // No space after ticker now
      price: 100,
      name: "Test ETF",
      lastUpdated: new Date().toISOString(),
    };
    await docClient.send(
      new PutCommand({
        TableName: "etfs",
        Item: etfItem,
      })
    );
    console.log("✅ Successfully wrote to etfs table");

    // Test portfolios table
    console.log("\nTesting portfolios table...");
    const portfolioItem = {
      userId: "test-user", // No space
      ticker: "TEST-ETF",
      totalShares: 100,
    };
    await docClient.send(
      new PutCommand({
        TableName: "portfolios",
        Item: portfolioItem,
      })
    );
    console.log("✅ Successfully wrote to portfolios table");

    // Test distributions table
    console.log("\nTesting distributions table...");
    const distributionItem = {
      ticker: "TEST-ETF", // No space
      date: new Date().toISOString(),
      amount: 0.5,
    };
    await docClient.send(
      new PutCommand({
        TableName: "distributions",
        Item: distributionItem,
      })
    );
    console.log("✅ Successfully wrote to distributions table");

    // Now test reading from each table
    console.log("\nTesting reads...");

    const etfGet = await docClient.send(
      new GetCommand({
        TableName: "etfs",
        Key: { ticker: "TEST-ETF" },
      })
    );
    console.log("✅ Read from etfs table:", etfGet.Item);

    const portfolioGet = await docClient.send(
      new GetCommand({
        TableName: "portfolios",
        Key: {
          userId: "test-user",
          ticker: "TEST-ETF",
        },
      })
    );
    console.log("✅ Read from portfolios table:", portfolioGet.Item);

    const distributionGet = await docClient.send(
      new GetCommand({
        TableName: "distributions",
        Key: {
          ticker: "TEST-ETF",
          date: distributionItem.date,
        },
      })
    );
    console.log("✅ Read from distributions table:", distributionGet.Item);

    return true;
  } catch (error) {
    console.error("Error:", error);
    console.error("Error details:", error.message);
    return false;
  }
};
