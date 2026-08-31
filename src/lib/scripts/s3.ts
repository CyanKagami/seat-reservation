import { S3Client, PutObjectCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import "dotenv/config"

const localstackUrl = process.env.AWS_LOCALSTACK_URL;

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
      accessKeyId: "test",
      secretAccessKey: "test",
    },
  // Only pass endpoint and path style if localstackUrl exists
  ...(localstackUrl && {
    endpoint: localstackUrl,
    forcePathStyle: true,
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

function removeInvalidXmlCharacters(str:string) {
  if (typeof str !== 'string') return '';

  // Matches forbidden XML 1.0 control characters
  // Keeps normal whitespace: tabs (\t), newlines (\n), carriage returns (\r)
  const invalidXmlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g;

  return str.replace(invalidXmlRegex, '');
}

export async function addFile(bucket:string, filename:string, fileBuffer:Buffer) {
    console.log(localstackUrl)
    await s3Client.send(new PutObjectCommand({
          Bucket: bucket,
          Key: removeInvalidXmlCharacters(filename),
          Body: fileBuffer,
      }));
    return `https://${bucket}.s3.${process.env.AWS_REGION}://${removeInvalidXmlCharacters(filename)}`
}

