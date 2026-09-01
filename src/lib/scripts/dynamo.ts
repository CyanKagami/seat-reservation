import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
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

function removeInvalidXmlCharacters(str:string) {
  if (typeof str !== 'string') return '';

  // Matches forbidden XML 1.0 control characters
  // Keeps normal whitespace: tabs (\t), newlines (\n), carriage returns (\r)
  const invalidXmlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g;

  return str.replace(invalidXmlRegex, '');
}

export async function addData(tableName:string, item:Object) {
  const uniqueId = uuidv4();
  const updatedObj = Object.fromEntries(
  Object.entries(item).map(([key, value]) => [key, typeof(value) === "string" ? removeInvalidXmlCharacters(value) : value])
);
  const params = {
    TableName: tableName,
    Item: {
      eventId: uniqueId,
      ...updatedObj
    },
    ConditionExpression: "attribute_not_exists(eventId)",
  };
  console.log(uniqueId)


  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error:any) {
    if (error.name === "ConditionalCheckFailedException") {
      console.warn("Collision detected! Retrying with a new ID...");
      addData(tableName, item); // Recursive retry strategy
    }
    if (error.$responseBodyText) {
      console.error("Dynamo Raw response text:", error.$responseBodyText);
    }
  // Inspect the full HTTP response object
    if (error.$response) {
      console.error("Dynamo HTTP Status Code:", error.$response.statusCode);
    }
  }
}