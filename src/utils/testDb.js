import { testTables } from "./dynamoDbSetup.js";

const runTest = async () => {
  console.log("Starting DynamoDB table tests...");

  try {
    const success = await testTables();
    if (success) {
      console.log("\n✅ All tests passed successfully!");
    } else {
      console.log("\n❌ Tests failed. Check the error messages above.");
    }
  } catch (error) {
    console.error("\n❌ Tests failed with error:", error);
  }
};

runTest();
