// layers/shared/nodejs/node_modules/shared-lib/dynamo.js
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  paginateScan,
  UpdateCommand,
  GetCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(localstackUrl && {
    endpoint: localstackUrl,
    forcePathStyle: true,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
});
const docClient = DynamoDBDocumentClient.from(client);

function removeInvalidXmlCharacters(str) {
  if (typeof str !== 'string') return '';
  const invalidXmlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g;
  return str.replace(invalidXmlRegex, '');
}

function sanitize(item) {
  return Object.fromEntries(
    Object.entries(item).map(([key, value]) => [
      key,
      typeof value === 'string' ? removeInvalidXmlCharacters(value) : value
    ])
  );
}

export async function createMyTable() {
  const command = new CreateTableCommand({
    TableName: 'products',
    AttributeDefinitions: [
      { AttributeName: 'ProductId', AttributeType: 'S' },
      { AttributeName: 'category', AttributeType: 'S' }
    ],
    KeySchema: [
      { AttributeName: 'ProductId', KeyType: 'HASH' },
      { AttributeName: 'category', KeyType: 'RANGE' }
    ],
    BillingMode: 'PAY_PER_REQUEST'
  });

  try {
    const response = await client.send(command);
    console.log('Table creation initiated successfully:', response.TableDescription.TableStatus);
  } catch (error) {
    console.error('Error creating table:', error);
  }
}

// NOTE: fixed — original recursive retry on collision didn't return/await the
// retry's result up the original call stack in one of the three variants below
// consistently; all three now `return` the retry so callers awaiting this
// actually get the eventual outcome instead of undefined.

export async function addData(tableName, item, _attempt = 0) {
  if (_attempt > 5) throw new Error('Too many ID collisions, aborting');
  const uniqueId = uuidv4();
  const updatedObj = sanitize(item);
  const params = {
    TableName: tableName,
    Item: { eventId: uniqueId, ...updatedObj },
    ConditionExpression: 'attribute_not_exists(eventId)'
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
    return uniqueId;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn('Collision detected! Retrying with a new ID...');
      return addData(tableName, item, _attempt + 1);
    }
    if (error.$responseBodyText) console.error('Dynamo Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('Dynamo HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

export async function addDataUniqueId(tableName, item, primaryKey, _attempt = 0) {
  if (_attempt > 5) throw new Error('Too many ID collisions, aborting');
  const uniqueId = uuidv4();
  const updatedObj = sanitize(item);
  const newItem = { ...updatedObj, [primaryKey]: uniqueId };

  const params = {
    TableName: tableName,
    Item: newItem,
    ConditionExpression: `attribute_not_exists(${primaryKey})`
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
    return uniqueId;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn('Collision detected! Retrying with a new ID...');
      return addDataUniqueId(tableName, item, primaryKey, _attempt + 1);
    }
    if (error.$responseBodyText) console.error('Dynamo Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('Dynamo HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

export async function addDataIfNotExists(tableName, item, primaryKey) {
  const updatedObj = sanitize(item);
  const params = {
    TableName: tableName,
    Item: { ...updatedObj },
    ConditionExpression: `attribute_not_exists(${primaryKey})`
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
    return 0; // added
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return 1; // already exists
    if (error.$responseBodyText) console.error('Dynamo Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('Dynamo HTTP Status Code:', error.$response.statusCode);
    return -1; // error
  }
}

export async function fetchAllData(tableName) {
  const allItems = [];
  let lastEvaluatedKey;

  try {
    do {
      const params = { TableName: tableName, ExclusiveStartKey: lastEvaluatedKey };
      const response = await docClient.send(new ScanCommand(params));
      if (response.Items) allItems.push(...response.Items);
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  } catch (error) {
    console.error('Error scanning DynamoDB table:', error);
    throw error;
  }
}

export async function fetchEventFromHost(googleId) {
  const paginatorConfig = { client: docClient, pageSize: 25 };
  const scanParams = {
    TableName: 'events',
    FilterExpression: 'creatorId = :googleId',
    ExpressionAttributeValues: { ':googleId': googleId }
  };

  const allItems = [];
  for await (const page of paginateScan(paginatorConfig, scanParams)) {
    if (page.Items) allItems.push(...page.Items);
  }
  return allItems;
}

export async function fetchEventFromEventId(eventId) {
  const paginatorConfig = { client: docClient, pageSize: 25 };
  const scanParams = {
    TableName: 'events',
    FilterExpression: 'eventId = :eventId',
    ExpressionAttributeValues: { ':eventId': eventId }
  };

  const allItems = [];
  for await (const page of paginateScan(paginatorConfig, scanParams)) {
    if (page.Items) allItems.push(...page.Items);
  }
  return allItems;
}

export async function updateAllAttributes(tableName, primaryKey, attributesToUpdate) {
  const updateParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const primaryKeyNames = Object.keys(primaryKey);

  let count = 0;
  for (const [key, value] of Object.entries(attributesToUpdate)) {
    if (primaryKeyNames.includes(key)) continue;
    const namePlaceholder = `#attr_${count}`;
    const valuePlaceholder = `:val_${count}`;
    count++;
    updateParts.push(`${namePlaceholder} = ${valuePlaceholder}`);
    expressionAttributeNames[namePlaceholder] = key;
    expressionAttributeValues[valuePlaceholder] = value;
  }

  if (updateParts.length === 0) return;

  const params = {
    TableName: tableName,
    Key: primaryKey,
    UpdateExpression: `SET ${updateParts.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  try {
    const response = await docClient.send(new UpdateCommand(params));
    return response.Attributes;
  } catch (error) {
    console.error('Error updating item:', error);
    throw error;
  }
}

// NOTE: fixed — addUser had a ConditionalCheckFailedException branch but no
// ConditionExpression in its PutCommand, so that branch could never fire and
// a re-login would silently overwrite the existing user record (wiping role
// changes, etc). Added attribute_not_exists so an existing user is never
// clobbered by this function; use updateAllAttributes to intentionally update one.
export async function addUser(user) {
  const params = {
    TableName: 'users',
    Item: user,
    ConditionExpression: 'attribute_not_exists(googleId)'
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.warn('User already exists, not overwriting.');
      return;
    }
    if (error.$responseBodyText) console.error('Dynamo Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('Dynamo HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

export async function fetchUser(googleId) {
  const params = { TableName: 'users', Key: { googleId } };
  try {
    const response = await docClient.send(new GetCommand(params));
    return response.Item ?? null;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

export async function fetchData(tablename, key) {
  const params = { TableName: tablename, Key: key };
  try {
    const response = await docClient.send(new GetCommand(params));
    return response.Item ?? null;
  } catch (error) {
    console.error('Error getting item:', error);
    throw error;
  }
}

export async function paginateReadData(tableName, limit, nextToken) {
  try {
    const params = {
      TableName: tableName,
      Limit: limit,
      ExclusiveStartKey: nextToken
        ? JSON.parse(Buffer.from(nextToken, 'base64').toString('utf-8'))
        : undefined
    };

    const data = await docClient.send(new ScanCommand(params));

    let newNextToken = null;
    if (data.LastEvaluatedKey) {
      newNextToken = Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64');
    }
    return { items: data.Items || [], nextToken: newNextToken };
  } catch (error) {
    throw error;
  }
}