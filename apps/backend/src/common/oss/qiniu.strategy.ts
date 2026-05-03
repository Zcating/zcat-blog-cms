import * as qiniu from 'qiniu';

import { Cache } from '@backend/utils';

import type { OssStrategy, OssType } from './oss.strategy';

const TTL = 3600;
const MAX_CACHE_SIZE = 2000;

interface OssInfo {
  bucket: string;
  domain: string;
}

function createBucketManager(): qiniu.rs.BucketManager {
  const accessKey = process.env.OSS_ACCESS_KEY ?? '';
  const secretKey = process.env.OSS_SECRET_KEY ?? '';
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const config = new qiniu.conf.Config();
  return new qiniu.rs.BucketManager(mac, config);
}

function createOssInfoMap(): Map<OssType, OssInfo> {
  return new Map<OssType, OssInfo>([
    [
      'photo',
      {
        bucket: process.env.OSS_PHOTO_BUCKET ?? '',
        domain: process.env.OSS_PHOTO_DOMAIN ?? '',
      },
    ],
    [
      'article',
      {
        bucket: process.env.OSS_ARTICLE_BUCKET ?? '',
        domain: process.env.OSS_ARTICLE_DOMAIN ?? '',
      },
    ],
  ]);
}

function createPrivateUrlCache(): Cache<string> {
  return new Cache<string>(MAX_CACHE_SIZE, TTL);
}

function getPrivateDownloadUrl(
  bucketManager: qiniu.rs.BucketManager,
  domain: string,
  filename: string,
): string {
  const now = Math.floor(Date.now() / 1000);
  const deadline = now + TTL;
  return bucketManager.privateDownloadUrl(domain, filename, deadline);
}

function getPublicDownloadUrl(
  bucketManager: qiniu.rs.BucketManager,
  domain: string,
  filename: string,
): string {
  return bucketManager.publicDownloadUrl(domain, filename);
}

async function deleteOssFile(
  bucketManager: qiniu.rs.BucketManager,
  bucketName: string,
  filename: string,
): Promise<boolean> {
  try {
    await bucketManager.delete(bucketName, filename);
    return true;
  } catch {
    return false;
  }
}

function generateUploadToken(
  bucketName: string,
  accessKey: string,
  secretKey: string,
): string {
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const putPolicy = new qiniu.rs.PutPolicy({ scope: bucketName });
  return putPolicy.uploadToken(mac);
}

export function createQiniuStrategy(): OssStrategy {
  const bucketManager = createBucketManager();
  const ossInfoMap = createOssInfoMap();
  const privateUrlCache = createPrivateUrlCache();

  const getOssInfo = (type: OssType): OssInfo | undefined => {
    return ossInfoMap.get(type);
  };

  return {
    async getPrivateUrl(key: string, type: OssType): Promise<string> {
      const ossInfo = getOssInfo(type);
      if (!ossInfo || !ossInfo.domain) {
        return '';
      }

      const cached = privateUrlCache.get(key);
      if (cached) {
        return cached;
      }

      const url = getPrivateDownloadUrl(bucketManager, ossInfo.domain, key);
      privateUrlCache.set(key, url);
      return url;
    },

    async deleteFile(key: string, type: OssType): Promise<void> {
      const ossInfo = getOssInfo(type);
      if (!ossInfo || !ossInfo.bucket) {
        return;
      }
      await deleteOssFile(bucketManager, ossInfo.bucket, key);
    },

    async getArticleUrl(key: string): Promise<string> {
      const ossInfo = getOssInfo('article');
      if (!ossInfo || !ossInfo.domain) {
        return '';
      }
      return getPublicDownloadUrl(bucketManager, ossInfo.domain, key);
    },

    async deleteArticleFile(key: string): Promise<void> {
      const ossInfo = getOssInfo('article');
      if (!ossInfo || !ossInfo.bucket) {
        return;
      }
      await deleteOssFile(bucketManager, ossInfo.bucket, key);
    },

    getBucket(type: OssType): string {
      const ossInfo = getOssInfo(type);
      return ossInfo?.bucket ?? '';
    },

    getUploadToken(type: OssType): string {
      const ossInfo = getOssInfo(type);
      if (!ossInfo || !ossInfo.bucket) {
        return '';
      }
      const accessKey = process.env.OSS_ACCESS_KEY ?? '';
      const secretKey = process.env.OSS_SECRET_KEY ?? '';
      return generateUploadToken(ossInfo.bucket, accessKey, secretKey);
    },
  };
}
