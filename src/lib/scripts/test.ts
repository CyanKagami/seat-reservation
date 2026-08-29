import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import 'dotenv/config'; 

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

export const s3Client = new S3Client({
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

async function createMyTable() {
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

async function addProduct() {
  const params = {
    TableName: "products",
    Item: {
      ProductId: "Product01",
      description: "Hiking Boots",
      category: "footwear",
      sku: "hiking-sku-01",
      size: 9,
    },
  };

  try {
    const data = await docClient.send(new PutCommand(params));
    console.log('result : ' + JSON.stringify(data));
  } catch (error) {
    console.error("Error:", error);
  }
}

async function createBucket(bucketName:string) {
  try {
    // 2. Execute the CreateBucketCommand
    const command = new CreateBucketCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);
    
    console.log(`Bucket "${bucketName}" created successfully!`, response);
  } catch (error) {
    console.error("Error creating bucket:", error);
  }
}

async function run(){
  await createMyTable();
  await createBucket("my-local-bucket");

  await addProduct();
  await s3Client.send(new PutObjectCommand({
      Bucket: "my-local-bucket",
      Key: "file.txt",
      Body: "Hello LocalStack!",
  }));
}

run()