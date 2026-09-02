import { DynamoDBClient, CreateTableCommand, GetItemCommand, type GetItemCommandInput } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, type ScanCommandInput, paginateScan, UpdateCommand, GetCommand, type PutCommandInput } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import "dotenv/config"
import type { User } from "$lib/type/user";

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

interface Key {
  [key:string]:any
}

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

export async function addDataIfNotExists(tableName:string, item:Object, primaryKey:string) {
  const updatedObj = Object.fromEntries(
  Object.entries(item).map(([key, value]) => [key, typeof(value) === "string" ? removeInvalidXmlCharacters(value) : value])
);
  const params = {
    TableName: tableName,
    Item: {
      ...updatedObj
    },
    ConditionExpression: `attribute_not_exists(${primaryKey})`,
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
    return 0; // Item added successfully
  } catch (error:any) {
    if (error.name === "ConditionalCheckFailedException") {
      return 1; // Item already exists
    }
    if (error.$responseBodyText) {
      console.error("Dynamo Raw response text:", error.$responseBodyText);
    }
  // Inspect the full HTTP response object
    if (error.$response) {
      console.error("Dynamo HTTP Status Code:", error.$response.statusCode);
    }
    return -1; // Error occurred
  }
}

export async function fetchAllData(tableName: string): Promise<Record<string, any>[]> {
  const allItems: Record<string, any>[] = [];
  let lastEvaluatedKey: Record<string, any> | undefined = undefined;

  try {
    do {
      // Configure scan parameters
      const params: ScanCommandInput = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey, // Resume from the last checkpoint
      };

      // Execute the scan command
      const command = new ScanCommand(params);
      const response = await docClient.send(command);

      // Store retrieved items
      if (response.Items) {
        allItems.push(...response.Items);
      }

      // Track the pagination token
      lastEvaluatedKey = response.LastEvaluatedKey;

    } while (lastEvaluatedKey); // Continue loop if there are more pages

    return allItems;
  } catch (error) {
    console.error("Error scanning DynamoDB table:", error);
    throw error;
  }
}

export async function fetchEventFromHost(googleId:string) {
  const paginatorConfig = { client: docClient, pageSize: 25 };
  const scanParams = {
    TableName: "events",
    FilterExpression: "host = :googleId",
    ExpressionAttributeValues: {
      ":googleId": googleId
    }
  };

  const allItems = [];

  for await (const page of paginateScan(paginatorConfig, scanParams)) {
    if (page.Items) {
      allItems.push(...page.Items);
    }
  }

  console.log("Total items matching filter:", allItems.length);
  return allItems;
}

export async function fetchEventFromEventId(eventId:string) {
  const paginatorConfig = { client: docClient, pageSize: 25 };
  const scanParams = {
    TableName: "events",
    FilterExpression: "eventId = :eventId",
    ExpressionAttributeValues: {
      ":eventId": eventId
    }
  };

  const allItems = [];

  for await (const page of paginateScan(paginatorConfig, scanParams)) {
    if (page.Items) {
      allItems.push(...page.Items);
    }
  }

  console.log(eventId)
  console.log("Total items matching filter:", allItems.length);
  return allItems;
}

export async function updateAllAttributes(tableName:string, primaryKey:Key, attributesToUpdate:Object) {
  const updateParts = [];
  const expressionAttributeNames:{[key:string]:any} = {};
  const expressionAttributeValues:{[key:string]:any} = {};

  // Extract primary key names to prevent trying to update them
  const primaryKeyNames = Object.keys(primaryKey);

  let count = 0
  for (const [key, value] of Object.entries(attributesToUpdate)) {
    // Skip primary key fields (DynamoDB throwing an error if updated)
    if (primaryKeyNames.includes(key)) continue;

    const namePlaceholder = `#attr_${count}`;
    const valuePlaceholder = `:val_${count}`;
    count++;

    updateParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
    expressionAttributeNames[namePlaceholder] = key;
    expressionAttributeValues[valuePlaceholder] = value;
  }

  console.log(updateParts.join(", "))
  // If no attributes are left to update, exit
  if (updateParts.length === 0) return;

  const params = {
    TableName: tableName,
    Key: primaryKey, // e.g., { userId: "12345" }
    UpdateExpression: `SET ${updateParts.join(", ")}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: "ALL_NEW" // Returns the entire item after modification
  };

  try {
    // @ts-ignore
    const response = await docClient.send(new UpdateCommand(params));
    return response.Attributes;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
}

export async function addUser(user:Object) {
  const params:PutCommandInput = {
    TableName: 'users',
    // Define the exact primary key match
    Item: user,
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error:any) {
    if (error.name === "ConditionalCheckFailedException") {
      console.warn("Collision detected! Retrying with a new ID...");
      await addUser(user); // Recursive retry strategy
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

export async function fetchUser(googleId:string) {
  const params = {
    TableName: 'users',
    // Define the exact primary key match
    Key: {
      googleId: googleId, // Partition Key (HASH)
    },
  };
  console.log("Fetching user with params:", params);
  try {
    const command = new GetCommand(params);
    const response = await docClient.send(command);

    if (response.Item) {
      console.log('Item found:', response.Item);
      return response.Item;
    } else {
      console.log('No item found with the specified key.');
      return null;
    }
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

export async function paginateReadData(tableName:string, limit:number, nextToken?:string) {
  try {

    const params:ScanCommandInput = {
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8')) : undefined
    };

    // Execute DynamoDB Scan
    const command = new ScanCommand(params);
    const data = await docClient.send(command);

    // Encode LastEvaluatedKey for the client response
    let newNextToken = null;
    if (data.LastEvaluatedKey) {
      newNextToken = Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64');
    }
    return {
      items: data.Items || [],
      nextToken: newNextToken,
    }
  } catch (error) {
    throw error;
  }
}