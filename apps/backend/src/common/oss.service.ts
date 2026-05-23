import { Client } from 'minio';

import { config } from './config.service';

type OssType = 'article' | 'photo';

function getBucketConfig(type: OssType): { bucket: string; domain: string } {
  const bucket = config.minioBucket;
  return { bucket, domain: config.minioPublicUrl };
}

function createMinioClient(): Client {
  return new Client({
    endPoint: config.minioEndpoint,
    port: config.minioPort,
    useSSL: config.minioUseSsl,
    accessKey: config.minioAccessKey,
    secretKey: config.minioSecretKey,
  });
}

const minioClient = createMinioClient();

function getUrl(type: OssType, key: string): string {
  if (!config.minioPublicUrl) {
    return '';
  }
  const { bucket } = getBucketConfig(type);
  return `${config.minioPublicUrl}/${bucket}/${key}`;
}

async function deleteObject(type: OssType, key: string): Promise<void> {
  const { bucket } = getBucketConfig(type);
  if (!bucket) {
    return;
  }
  await minioClient.removeObject(bucket, key);
}

async function presignUploadUrl(type: OssType, key: string): Promise<string> {
  const { bucket } = getBucketConfig(type);
  if (!bucket) {
    return '';
  }
  try {
    const url = await minioClient.presignedPutObject(bucket, key, 60);
    return url;
  } catch {
    return '';
  }
}

// Facade methods (backward-compatible signatures)
function getPrivateUrl(key: string): string {
  return getUrl('photo', key);
}

function getArticleUrl(key: string): string {
  return getUrl('article', key);
}

async function deleteFile(key: string): Promise<boolean> {
  try {
    await deleteObject('photo', key);
    return true;
  } catch {
    return false;
  }
}

export const ossService = {
  getUrl,
  deleteObject,
  presignUploadUrl,
  getPrivateUrl,
  getArticleUrl,
  deleteFile,
};
