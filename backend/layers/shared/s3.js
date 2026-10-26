// layers/shared/s3.js
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3';

export const BUCKET = process.env.S3_BUCKET || 'k-seat-object';
const localstackUrl = process.env.AWS_LOCALSTACK_URL;
const region = process.env.AWS_REGION || 'us-east-1';

export const s3Client = new S3Client({
  region,
  ...(localstackUrl
    ? { endpoint: localstackUrl, forcePathStyle: true, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }
    : {})
});

export async function createBucket(bucketName) {
  try {
    const response = await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" created successfully!`, response);
  } catch (error) {
    console.error('Error creating bucket:', error);
  }
}

function removeInvalidXmlCharacters(str) {
  if (typeof str !== 'string') return '';
  const invalidXmlRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F]/g;
  return str.replace(invalidXmlRegex, '');
}

const MIME_TYPES = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  json: 'application/json',
  txt: 'text/plain',
  pdf: 'application/pdf',
  msgpack: 'application/octet-stream',
};

function guessContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export function getObjectURL(folder, filename) {
  const cleanFileName = removeInvalidXmlCharacters(filename);
  const key = `${folder}/${cleanFileName}`;
  if (localstackUrl) return `${localstackUrl}/${BUCKET}/${key}`;
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
}

// addFile(folder, filename, fileBuffer) — stores at key folder/filename.
export async function addFile(folder, filename, fileBuffer) {
  const cleanFileName = removeInvalidXmlCharacters(filename);
  const key = `${folder}/${cleanFileName}`;
  const contentType = guessContentType(cleanFileName);
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    }));
    if (localstackUrl) return `${localstackUrl}/${BUCKET}/${key}`;
    return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`;
  } catch (error) {
    if (error.$responseBodyText) console.error('S3 Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('S3 HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

// deleteFile(folder, filename) — deletes key folder/filename.
export async function deleteFile(folder, filename) {
  const cleanFileName = removeInvalidXmlCharacters(filename);
  const key = `${folder}/${cleanFileName}`;
  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}

// deleteObjectsWithPrefix(prefix) — batch-deletes all objects under prefix.
export async function deleteObjectsWithPrefix(prefix) {
  let isTruncated = true;
  let continuationToken = undefined;

  while (isTruncated) {
    const listResponse = await s3Client.send(new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken
    }));

    if (!listResponse.Contents || listResponse.Contents.length === 0) break;

    const objectsToDelete = listResponse.Contents.map((obj) => ({ Key: obj.Key }));
    await s3Client.send(new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: objectsToDelete, Quiet: true }
    }));
    console.log(`Deleted ${objectsToDelete.length} objects with prefix "${prefix}".`);

    isTruncated = listResponse.IsTruncated || false;
    continuationToken = listResponse.NextContinuationToken;
  }
}

// readFileAsString(fileKey) — fileKey is the full S3 key.
export async function readFileAsString(fileKey) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
  try {
    const response = await s3Client.send(command);
    if (response.Body) return await response.Body.transformToString();
    return '';
  } catch (error) {
    console.error('Error reading file from S3:', error);
    return '';
  }
}

// readFileAsByteArray(fileKey) — fileKey is the full S3 key.
export async function readFileAsByteArray(fileKey) {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: fileKey });
  try {
    const response = await s3Client.send(command);
    if (response.Body) return await response.Body.transformToByteArray();
    return new Uint8Array();
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}
