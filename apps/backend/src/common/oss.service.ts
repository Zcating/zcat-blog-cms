import { Client } from 'minio';

import { config } from './config.service';

function createOssClient(): Client {
  return new Client({
    endPoint: config.ossEndpoint,
    port: config.ossPort,
    useSSL: config.ossUseSsl,
    accessKey: config.ossAccessKey,
    secretKey: config.ossSecretKey,
  });
}

const ossClient = createOssClient();

function getUrl(key: string): string {
  if (!config.ossPublicUrl) {
    return '';
  }
  return `${config.ossPublicUrl}/${config.ossBucket}/${key}`;
}

async function deleteObject(key: string): Promise<void> {
  if (!config.ossBucket) {
    return;
  }
  await ossClient.removeObject(config.ossBucket, key);
}

async function presignUploadUrl(key: string): Promise<string> {
  if (!config.ossBucket) {
    return '';
  }
  try {
    const url = await ossClient.presignedPutObject(config.ossBucket, key, 60);
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
