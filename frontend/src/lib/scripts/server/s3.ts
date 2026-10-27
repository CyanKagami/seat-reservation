import { AWS_LOCALSTACK_URL, AWS_REGION } from "$env/static/private";
import { S3Client, PutObjectCommand, CreateBucketCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
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

export function getObjectURL(folder:string, filename:string){
  let cleanFileName = removeInvalidXmlCharacters(filename);
  if (localstackUrl) {
      return `${localstackUrl}/${BUCKET}/${folder}/${cleanFileName}`
  }
  return `https://${BUCKET}.s3.${AWS_REGION}://${folder}/${cleanFileName}`
}

export function extractKey(objectURL:string){
  const PREFIX = (localstackUrl) ? `${localstackUrl}/${BUCKET}/` : `https://${BUCKET}.s3.${AWS_REGION}://`;
  if (objectURL.startsWith(PREFIX)) {
        // PREFIX is exactly at the beginning
    let segments = objectURL.slice(PREFIX.length).split('/');
    let name = segments.pop()
    let folder = segments.join('/');
    return {folder:folder,filename:name};
  }
  let segments = objectURL.split('/');
  let name = segments.pop()
  let folder = segments.join('/');
  return {folder:folder,filename:name};
}

export async function addFile(folder:string, filename:string, fileBuffer:Buffer) {
    let cleanFileName = removeInvalidXmlCharacters(filename);
    try {
      await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET,
          Key: `${folder}/${cleanFileName}`,
          Body: fileBuffer,
      }));
    return getObjectURL(folder, filename);
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

export async function deleteFile(folder:string, fileKey:string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: `${folder}/${fileKey}`,
  });

  try {
    const response = await s3Client.send(command);
    // 2. Convert the stream to a string directly
    return response
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw error
  }
}

export async function deleteObjectsWithPrefix(prefix:string, keepKeys:Set<string> = new Set()) {
  let isTruncated = true;
  let continuationToken = undefined;

  while (isTruncated) {
    // 1. List objects with the specific prefix
    const listCommand:ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("No objects found with this prefix.");
      break;
    }

    // 2. Format object keys for the batch delete request
    const objectsToDelete = listResponse.Contents
        .filter((obj) => !keepKeys.has(obj.Key || ''))
        .map((obj) => ({ Key: obj.Key }));

    // 3. Execute batch deletion (up to 1,000 objects)
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: {
        Objects: objectsToDelete,
        Quiet: true, // Only returns errors in the response payload
      },
    });

    const deleteResponse = await s3Client.send(deleteCommand);
    console.log(`Successfully deleted ${objectsToDelete.length} objects.`);

    // 4. Check if there are more objects remaining to process
    isTruncated = listResponse.IsTruncated || false;
    continuationToken = listResponse.NextContinuationToken;
  }
  
  console.log("Deletion completed successfully.");
}