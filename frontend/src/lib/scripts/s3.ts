import { AWS_LOCALSTACK_URL, AWS_REGION } from "$env/static/private";
import { S3Client, PutObjectCommand, CreateBucketCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import "dotenv/config"

export const BUCKET = 'k-seat-object';
const localstackUrl = AWS_LOCALSTACK_URL;

export const s3Client = new S3Client({
  region: AWS_REGION || "us-east-1",
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

export async function addFile(folder:string, filename:string, fileBuffer:Buffer) {
    let cleanFileName = removeInvalidXmlCharacters(filename);
    try {
      await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${folder}/${cleanFileName}`,
          Body: fileBuffer,
      }));
    if (localstackUrl) {
      console.log(`File "${cleanFileName}" uploaded successfully to localstack at ${localstackUrl}/${BUCKET}/${folder}/${cleanFileName}`);
      return `${localstackUrl}/${BUCKET}/${folder}/${cleanFileName}`
    }
    return `https://${BUCKET}.s3.${AWS_REGION}://${folder}/${cleanFileName}`
  }
  catch (error:any) {
    if (error.$responseBodyText) {
      console.error("S3 Raw response text:", error.$responseBodyText);
    }
    // Inspect the full HTTP response object
    if (error.$response) {
      console.error("S3 HTTP Status Code:", error.$response.statusCode);
    }
    throw error;
  }
}

export async function readFileAsString(folder:string, fileKey:string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: `${folder}/${fileKey}`,
  });

  try {
    const response = await s3Client.send(command);
    // 2. Convert the stream to a string directly
    if (response.Body){
       const fileContent = await response.Body.transformToString();
       return fileContent
    }
    return '';
  } catch (error) {
    console.error("Error reading file from S3:", error);
    return ''
  }
}

export async function readFileAsByteArray(folder:string, fileKey:string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: `${folder}/${fileKey}`,
  });

  try {
    const response = await s3Client.send(command);
    // 2. Convert the stream to a string directly
    if (response.Body){
       const fileContent = await response.Body.transformToByteArray();
       return fileContent
    }
    return new Uint8Array();
  } catch (error) {
    console.error("Error reading file from S3:", error);
    throw error
  }
}

