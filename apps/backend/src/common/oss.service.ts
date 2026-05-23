import { Client } from 'minio';

import { config } from './config.service';

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

function getUrl(key: string): string {
  if (!config.minioPublicUrl) {
    return '';
  }
  return `${config.minioPublicUrl}/${config.minioBucket}/${key}`;
}

async function deleteObject(key: string): Promise<void> {
  if (!config.minioBucket) {
    return;
  }
  await minioClient.removeObject(config.minioBucket, key);
}

async function presignUploadUrl(key: string): Promise<string> {
  if (!config.minioBucket) {
    return '';
  }
  try {
    const url = await minioClient.presignedPutObject(
      config.minioBucket,
      key,
      60,
    );
    return url;
  } catch {
    return '';
  }
}

function getPrivateUrl(key: string): string {
  return getUrl(key);
}

function getArticleUrl(key: string): string {
  return getUrl(key);
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
  getUrl,
  deleteObject,
  presignUploadUrl,
  getPrivateUrl,
  getArticleUrl,
  deleteFile,
};
