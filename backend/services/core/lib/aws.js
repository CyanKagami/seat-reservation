import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { v4 as uuid } from 'uuid';

const localstackUrl = process.env.AWS_LOCALSTACK_URL;
const awsOptions = {
  region: process.env.AWS_REGION || 'us-east-1',
  ...(localstackUrl && {
    endpoint: localstackUrl,
    forcePathStyle: true,
    credentials: { accessKeyId: 'test', secretAccessKey: 'test' }
  })
};

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient(awsOptions));
const s3 = new S3Client(awsOptions);

export async function fetchData(TableName, Key) {
  return (await dynamo.send(new GetCommand({ TableName, Key }))).Item ?? null;
}

export async function fetchAllData(TableName) {
  const items = [];
  let ExclusiveStartKey;
  do {
    const response = await dynamo.send(new ScanCommand({ TableName, ExclusiveStartKey }));
    items.push(...(response.Items ?? []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export async function fetchEventsForHost(googleId) {
  const response = await dynamo.send(new ScanCommand({
    TableName: 'events',
    FilterExpression: 'creatorId = :googleId',
    ExpressionAttributeValues: { ':googleId': googleId }
  }));
  return response.Items ?? [];
}

export async function fetchEventById(eventId) {
  const response = await dynamo.send(new ScanCommand({
    TableName: 'events',
    FilterExpression: 'eventId = :eventId',
    ExpressionAttributeValues: { ':eventId': eventId }
  }));
  return response.Items ?? [];
}

export async function addDataUniqueId(TableName, item, primaryKey) {
  const id = uuid();
  await dynamo.send(new PutCommand({
    TableName,
    Item: { ...item, [primaryKey]: id },
    ConditionExpression: `attribute_not_exists(${primaryKey})`
  }));
  return id;
}

export async function putData(TableName, Item) {
  await dynamo.send(new PutCommand({ TableName, Item }));
}

export async function updateAllAttributes(TableName, Key, attributes) {
  const entries = Object.entries(attributes).filter(([key]) => !Object.hasOwn(Key, key));
  if (!entries.length) return;
  const ExpressionAttributeNames = Object.fromEntries(entries.map(([key], i) => [`#n${i}`, key]));
  const ExpressionAttributeValues = Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value]));
  const UpdateExpression = `SET ${entries.map((_, i) => `#n${i} = :v${i}`).join(', ')}`;
  return (await dynamo.send(new UpdateCommand({
    TableName, Key, UpdateExpression, ExpressionAttributeNames, ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  }))).Attributes;
}

export async function paginateReadData(TableName, limit, nextToken) {
  const response = await dynamo.send(new ScanCommand({
    TableName,
    Limit: limit,
    ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64url').toString()) : undefined
  }));
  return {
    items: response.Items ?? [],
    nextToken: response.LastEvaluatedKey ? Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64url') : null
  };
}

export async function putFile(Bucket, Key, Body) {
  await s3.send(new PutObjectCommand({ Bucket, Key, Body }));
  return localstackUrl ? `${localstackUrl}/${Bucket}/${Key}` : `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${encodeURIComponent(Key)}`;
}

export async function getFile(Bucket, Key) {
  const result = await s3.send(new GetObjectCommand({ Bucket, Key }));
  return Buffer.from(await result.Body.transformToByteArray());
}
