import { Client } from 'minio';

import type { OssStrategy, OssType } from './oss.strategy';

interface OssInfo {
  bucket: string;
  domain: string;
}

const PRESIGNED_EXPIRY_SECONDS = 3600;

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

function createOssInfoMap(): Map<OssType, OssInfo> {
  return new Map<OssType, OssInfo>([
    [
      'photo',
      {
        bucket: process.env.MINIO_PHOTO_BUCKET ?? '',
        domain: process.env.MINIO_PHOTO_DOMAIN ?? '',
      },
    ],
    [
      'article',
      {
        bucket: process.env.MINIO_ARTICLE_BUCKET ?? '',
        domain: process.env.MINIO_ARTICLE_DOMAIN ?? '',
      },
    ],
  ]);
}

export function createMinioStrategy(): OssStrategy {
  const minioClient = createMinioClient();
  const ossInfoMap = createOssInfoMap();

  const getOssInfo = (type: OssType): OssInfo | undefined => {
    return ossInfoMap.get(type);
  };

  return {
    async getPrivateUrl(key: string, type: OssType): Promise<string> {
      const ossInfo = getOssInfo(type);
      if (!ossInfo || !ossInfo.bucket) {
        return '';
      }

      try {
        const url = await minioClient.presignedUrl(
          'GET',
          ossInfo.bucket,
          key,
          PRESIGNED_EXPIRY_SECONDS,
        );
        return url;
      } catch {
        return '';
      }
    },

    async deleteFile(key: string, type: OssType): Promise<void> {
      const ossInfo = getOssInfo(type);
      if (!ossInfo || !ossInfo.bucket) {
        return;
      }

      try {
        await minioClient.removeObject(ossInfo.bucket, key);
      } catch {
        // 忽略删除错误
      }
    },

    async getArticleUrl(key: string): Promise<string> {
      const ossInfo = getOssInfo('article');
      if (!ossInfo || !ossInfo.domain) {
        return '';
      }
      return `https://${ossInfo.domain}/${key}`;
    },

    async deleteArticleFile(key: string): Promise<void> {
      const ossInfo = getOssInfo('article');
      if (!ossInfo || !ossInfo.bucket) {
        return;
      }

      try {
        await minioClient.removeObject(ossInfo.bucket, key);
      } catch {
        // 忽略删除错误
      }
    },

    getBucket(type: OssType): string {
      const ossInfo = getOssInfo(type);
      return ossInfo?.bucket ?? '';
    },

    getUploadToken(_type: OssType): string {
      const accessKey = process.env.MINIO_ACCESS_KEY ?? '';
      const secretKey = process.env.MINIO_SECRET_KEY ?? '';
      if (!accessKey || !secretKey) {
        return '';
      }
      return `${accessKey}:${secretKey}`;
    },
  };
}
