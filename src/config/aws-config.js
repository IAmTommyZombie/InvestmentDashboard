import { fromCognitoIdentityPool } from "@aws-sdk/credential-providers";

export const awsConfig = {
  region: "us-east-2",
  credentials: fromCognitoIdentityPool({
    clientConfig: { region: "us-east-2" },
    identityPoolId: "us-east-2:2e53da69-4919-4399-8eb3-7eedd698e816", // Paste your ID here
  }),
};
