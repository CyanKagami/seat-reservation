import { S3Client, PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

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

export async function createBucket(bucketName:string) {
  try {
    // 2. Execute the CreateBucketCommand
    const command = new CreateBucketCommand({ Bucket: bucketName });
    const response = await s3Client.send(command);

    console.log(`Bucket "${bucketName}" created successfully!`, response);
  } catch (error) {
    console.error("Error creating bucket:", error);
  }
}

export async function addFile(bucket:string, filename:string, fileBuffer:Buffer) {
    await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: filename,
          Body: fileBuffer,
      }));
}