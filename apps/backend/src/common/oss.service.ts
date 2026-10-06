import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { config } from './config.service';

const UPLOAD_URL_TTL_SECONDS = 60;
const DOWNLOAD_URL_TTL_SECONDS = 3600;

function deriveRegion(endpoint: string): string {
  let hostname: string;
  try {
    hostname = new URL(endpoint).hostname;
  } catch {
    throw new Error(
      `Invalid OSS_ENDPOINT: ${JSON.stringify(endpoint)}. OSS_ENDPOINT must be an absolute URL that includes the scheme, for example https://oss-cn-guangzhou.aliyuncs.com`,
    );
  }
  const labels = hostname.split('.');
  return labels[0] === 's3' ? (labels[1] ?? '') : (labels[0] ?? '');
}

function createOssClient(): S3Client {
  return new S3Client({
    region: deriveRegion(config.ossEndpoint),
    endpoint: config.ossEndpoint,
    credentials: {
      accessKeyId: config.ossAccessKey,
      secretAccessKey: config.ossSecretKey,
    },
  });
}

const ossClient = createOssClient();

async function presignUploadUrl(key: string): Promise<string> {
  return getSignedUrl(
    ossClient,
    new PutObjectCommand({ Bucket: config.ossBucket, Key: key }),
    { expiresIn: UPLOAD_URL_TTL_SECONDS },
  );
}

async function presignDownloadUrl(key: string): Promise<string> {
  return getSignedUrl(
    ossClient,
    new GetObjectCommand({ Bucket: config.ossBucket, Key: key }),
    { expiresIn: DOWNLOAD_URL_TTL_SECONDS },
  );
}

async function deleteObject(key: string): Promise<void> {
  await ossClient.send(
    new DeleteObjectCommand({ Bucket: config.ossBucket, Key: key }),
  );
}

async function deleteFile(key: string): Promise<boolean> {
  try {
    await deleteObject(key);
    return true;
  } catch {
    return false;
  }
}

export const ossService = {
  presignUploadUrl,
  presignDownloadUrl,
  deleteObject,
  deleteFile,
};
