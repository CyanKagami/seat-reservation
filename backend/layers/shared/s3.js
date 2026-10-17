// layers/shared/nodejs/node_modules/shared-lib/s3.js
import { S3Client, PutObjectCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';

export const BUCKET = process.env.S3_BUCKET || 'k-seat-object';
const localstackUrl = process.env.AWS_LOCALSTACK_URL ;
const region = process.env.AWS_REGION || 'us-east-1';

export const s3Client = new S3Client({
  region,
  ...(localstackUrl
    ? { endpoint: localstackUrl, forcePathStyle: true, credentials: { accessKeyId: 'test', secretAccessKey: 'test' } }
    : {}) // in real AWS, let the Lambda execution role provide credentials — don't hardcode test creds there
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

export async function addFile(filename, fileBuffer) {
  const cleanFileName = removeInvalidXmlCharacters(filename);
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
  };

  function guessContentType(filename) {
    const ext = filename.split('.').pop()?.toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }
  try {
    await s3Client.send(new PutObjectCommand({ Bucket: BUCKET, Key: cleanFileName, Body: fileBuffer,ContentType: contentType || guessContentType(cleanFileName) }));

    if (localstackUrl) {
      return `${localstackUrl}/${BUCKET}/${cleanFileName}`;
    }
    // NOTE: fixed — original built "https://bucket.s3.region://key", which is
    // not a valid URL (malformed scheme). Standard virtual-hosted-style URL:
    return `https://${BUCKET}.s3.${region}.amazonaws.com/${cleanFileName}`;
  } catch (error) {
    if (error.$responseBodyText) console.error('S3 Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('S3 HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

export async function readFileAsString(fileKey) {
  const trueFileKey = fileKey;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: trueFileKey });
  try {
    const response = await s3Client.send(command);
    if (response.Body) {
      return await response.Body.transformToString();
    }
    return '';
  } catch (error) {
    console.error('Error reading file from S3:', error);
    return '';
  }
}

export async function readFileAsByteArray(fileKey) {
  const trueFileKey = fileKey;
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: trueFileKey });
  try {
    const response = await s3Client.send(command);
    if (response.Body) {
      return await response.Body.transformToByteArray();
    }
    return new Uint8Array();
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}