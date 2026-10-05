// layers/shared/nodejs/node_modules/shared-lib/s3.js
import { S3Client, PutObjectCommand, CreateBucketCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const localstackUrl = process.env.AWS_LOCALSTACK_URL;
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

export async function addFile(folder, filename, fileBuffer) {
  const cleanFileName = folder + '/' + removeInvalidXmlCharacters(filename);
  try {
    await s3Client.send(new PutObjectCommand({ Bucket: 'k-seat-object', Key: cleanFileName, Body: fileBuffer }));

    if (localstackUrl) {
      return `${localstackUrl}/k-seat-object/${cleanFileName}`;
    }
    // NOTE: fixed — original built "https://bucket.s3.region://key", which is
    // not a valid URL (malformed scheme). Standard virtual-hosted-style URL:
    return `https://k-seat-object.s3.${region}.amazonaws.com/${cleanFileName}`;
  } catch (error) {
    if (error.$responseBodyText) console.error('S3 Raw response text:', error.$responseBodyText);
    if (error.$response) console.error('S3 HTTP Status Code:', error.$response.statusCode);
    throw error;
  }
}

export async function readFileAsString(folder, fileKey) {
  const trueFileKey = folder + '/' + fileKey;
  const command = new GetObjectCommand({ Bucket: 'k-seat-object', Key: trueFileKey });
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

export async function readFileAsByteArray(folder, fileKey) {
  const trueFileKey = folder + '/' + fileKey;
  const command = new GetObjectCommand({ Bucket: 'k-seat-object', Key: trueFileKey });
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