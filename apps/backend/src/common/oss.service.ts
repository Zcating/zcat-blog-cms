import { Client } from 'minio';

type OssType = 'article' | 'photo';

function getBucketConfig(type: OssType): { bucket: string; domain: string } {
  const publicUrl = process.env.MINIO_PUBLIC_URL ?? '';
  const bucket =
    type === 'photo'
      ? (process.env.MINIO_PHOTO_BUCKET ?? '')
      : (process.env.MINIO_ARTICLE_BUCKET ?? '');
  return { bucket, domain: publicUrl };
}

function createMinioClient(): Client {
  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  const port = parseInt(process.env.MINIO_PORT ?? '9000', 10);
  const useSSL = process.env.MINIO_USE_SSL === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY ?? '';
  const secretKey = process.env.MINIO_SECRET_KEY ?? '';

  return new Client({
    endPoint: endpoint,
    port,
    useSSL,
    accessKey,
    secretKey,
  });
}

const minioClient = createMinioClient();

function getUrl(type: OssType, key: string): string {
  const domain = process.env.MINIO_PUBLIC_URL ?? '';
  if (!domain) {
    return '';
  }
  return `${domain}/pictures/${key}`;
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
