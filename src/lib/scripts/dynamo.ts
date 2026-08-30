import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import "dotenv/config"

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",

  // Only pass endpoint and path style if localstackUrl exists
  ...(localstackUrl && {
    endpoint: localstackUrl,
    forcePathStyle: true,
    credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  }),
});
const docClient = DynamoDBDocumentClient.from(client);

export async function createMyTable() {
  // 2. Define the configuration for the table
  const command = new CreateTableCommand({
    TableName: "products",
    AttributeDefinitions: [
      { AttributeName: "ProductId", AttributeType: "S" }, // 'S' represents String
      { AttributeName: "category", AttributeType: "S" },
    ],
    KeySchema: [
      { AttributeName: "ProductId", KeyType: "HASH" }, // Partition Key
      { AttributeName: "category", KeyType: "RANGE" }
    ],
    BillingMode: "PAY_PER_REQUEST" // On-demand scaling (recommended)
  });

  try {
    const response = await client.send(command);
    // @ts-ignore
    console.log("Table creation initiated successfully:", response.TableDescription.TableStatus);
  } catch (error) {
    console.error("Error creating table:", error);
  }
}

export async function addData(tableName:string, item:JSON) {
  const params = {
    TableName: tableName,
    Item: item,
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error) {
    console.error("Error:", error);
  }
}