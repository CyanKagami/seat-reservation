// layers/shared/dynamo.js
import { DynamoDBClient, CreateTableCommand } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
  GetCommand,
  DeleteCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { logError, logInfo, logWarn } from './logger.js';

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  ...(localstackUrl && {
    endpoint: localstackUrl,
    forcePathStyle: true,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
});
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

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
    logInfo('DynamoDB table creation initiated', {
      tableName: 'products',
      status: response.TableDescription.TableStatus
    });
  } catch (error) {
    logError('Failed to create DynamoDB table', error, { tableName: 'products' });
  }
}

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
    await docClient.send(new PutCommand(params));
    return uniqueId;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return addData(tableName, item, _attempt + 1);
    throw error;
  }
}

// extraFieldsFn(id) => { field: value } merged into item before write.
export async function addDataUniqueId(tableName, item, primaryKey, extraFieldsFn, _attempt = 0) {
  if (_attempt > 5) throw new Error('Too many ID collisions, aborting');
  const uniqueId = uuidv4();
  const updatedObj = sanitize(item);
  const extra = typeof extraFieldsFn === 'function' ? (extraFieldsFn(uniqueId) ?? {}) : {};
  const newItem = { ...updatedObj, ...extra, [primaryKey]: uniqueId };
  const params = {
    TableName: tableName,
    Item: newItem,
    ConditionExpression: `attribute_not_exists(${primaryKey})`
  };
  try {
    await docClient.send(new PutCommand(params));
    return uniqueId;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return addDataUniqueId(tableName, item, primaryKey, extraFieldsFn, _attempt + 1);
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
    await docClient.send(new PutCommand(params));
    return 0;
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') return 1;
    logError('Failed to insert DynamoDB item if absent', error, { tableName });
    return -1;
  }
}

export async function fetchAllData(tableName, filter) {
  const allItems = [];
  let lastEvaluatedKey;

  const filterEntries = filter && typeof filter === 'object'
    ? Object.entries(filter).filter(([_, v]) => v !== undefined)
    : [];
  const hasFilter = filterEntries.length > 0;

  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const filterParts = [];

  if (hasFilter) {
    filterEntries.forEach(([key, value], index) => {
      const namePlaceholder = `#filterKey_${index}`;
      const valPlaceholder = `:filterVal_${index}`;
      expressionAttributeNames[namePlaceholder] = key;
      expressionAttributeValues[valPlaceholder] = value;
      filterParts.push(`${namePlaceholder} = ${valPlaceholder}`);
    });
  }

  try {
    do {
      const params = {
        TableName: tableName,
        ExclusiveStartKey: lastEvaluatedKey
      };

      if (hasFilter) {
        params.FilterExpression = filterParts.join(' AND ');
        params.ExpressionAttributeNames = expressionAttributeNames;
        params.ExpressionAttributeValues = expressionAttributeValues;
      }

      const response = await docClient.send(new ScanCommand(params));
      if (response.Items) allItems.push(...response.Items);
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return allItems;
  } catch (error) {
    logError('Failed to scan DynamoDB table', error, {
      tableName,
      filtered: hasFilter
    });
    throw error;
  }
}

export async function fetchEventFromHost(creatorId) {
  return queryAllItems({
    TableName: 'events',
    IndexName: 'CreatorIndex',
    KeyConditionExpression: 'creatorId = :creatorId',
    ExpressionAttributeValues: { ':creatorId': creatorId }
  }, 'Failed to query events by creator', { creatorId });
}

async function queryAllItems(params, message, context) {
  const allItems = [];
  let lastEvaluatedKey;
  try {
    do {
      const response = await docClient.send(new QueryCommand({
        ...params,
        ExclusiveStartKey: lastEvaluatedKey
      }));
      allItems.push(...(response.Items ?? []));
      lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return allItems;
  } catch (error) {
    logError(message, error, { tableName: params.TableName, ...context });
    throw error;
  }
}

export async function fetchEventFromEventId(eventId) {
  const event = await fetchData('events', { eventId });
  return event ? [event] : [];
}

export async function updateAllAttributes(tableName, primaryKey, attributesToUpdate) {
  const updateParts = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};
  const primaryKeyNames = Object.keys(primaryKey);
  let count = 0;
  for (const [key, value] of Object.entries(attributesToUpdate)) {
    if (primaryKeyNames.includes(key) || value === undefined) continue;
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
    logError('Failed to update DynamoDB item', error, { tableName });
    throw error;
  }
}

// addUser — email is the hash key.
export async function addUser(user) {
  const params = {
    TableName: 'users',
    Item: user,
    ConditionExpression: 'attribute_not_exists(email)'
  };
  try {
    await docClient.send(new PutCommand(params));
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      logWarn('User already exists; existing record was preserved', { tableName: 'users' });
      return;
    }
    throw error;
  }
}

// fetchUser — looks up by email (the hash key).
export async function fetchUser(email) {
  const params = { TableName: 'users', Key: { email } };
  try {
    const response = await docClient.send(new GetCommand(params));
    return response.Item ?? null;
  } catch (error) {
    logError('Failed to fetch user from DynamoDB', error, { tableName: 'users' });
    throw error;
  }
}

export async function fetchData(tablename, key) {
  const params = { TableName: tablename, Key: key };
  try {
    const response = await docClient.send(new GetCommand(params));
    return response.Item ?? null;
  } catch (error) {
    logError('Failed to fetch DynamoDB item', error, { tableName: tablename });
    throw error;
  }
}

export async function deleteItem(tableName, key) {
  const params = { TableName: tableName, Key: key };
  try {
    await docClient.send(new DeleteCommand(params));
  } catch (error) {
    logError('Failed to delete DynamoDB item', error, { tableName });
    throw error;
  }
}

// batchGet — retries unprocessed keys, 100 per call max.
export async function batchGet(tableName, keys, projectionOptions = {}) {
  const items = [];
  for (let i = 0; i < keys.length; i += 100) {
    let pending = keys.slice(i, i + 100);
    for (let attempt = 0; pending && pending.length > 0 && attempt < 3; attempt++) {
      const res = await docClient.send(
        new BatchGetCommand({ RequestItems: { [tableName]: { Keys: pending, ...projectionOptions } } })
      );
      items.push(...(res.Responses?.[tableName] ?? []));
      pending = res.UnprocessedKeys?.[tableName]?.Keys;
    }
  }
  return items;
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
