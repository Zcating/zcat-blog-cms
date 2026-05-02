import * as qiniu from 'qiniu';

import { Cache } from '@backend/utils';

// 私有下载链接签名有效期（单位：秒）。
const TTL = 3600;
// 缓存上限（按 key 数量计），避免进程长期运行时无限增长。
const MAX_CACHE_SIZE = 2000;

type OssType = 'article' | 'photo';
interface OssInfo {
  bucket: string;
  domain: string;
}

const bucketManager: qiniu.rs.BucketManager = (() => {
  const accessKey = process.env.OSS_ACCESS_KEY ?? '';
  const secretKey = process.env.OSS_SECRET_KEY ?? '';
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const config = new qiniu.conf.Config();
  return new qiniu.rs.BucketManager(mac, config);
})();

const ossInfoMap = new Map<OssType, OssInfo>([
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

// 缓存 filename -> 私有下载链接，保证同一资源在 TTL 内返回稳定 URL，减少前端重复请求。
const privateUrlCache = new Cache<string>(MAX_CACHE_SIZE, TTL);

function getUrlFromBucket(
  domain: string,
  filename: string,
  type: 'private' | 'public' = 'private',
) {
  switch (type) {
    case 'public':
      return bucketManager.publicDownloadUrl(domain, filename);
    case 'private':
    default: {
      const now = Math.floor(Date.now() / 1000);
      const deadline = now + TTL;
      return bucketManager.privateDownloadUrl(domain, filename, deadline);
    }
  }
}

async function deleteOssFile(bucketName: string, filename: string) {
  try {
    await bucketManager.delete(bucketName, filename);
    return true;
  } catch {
    return false;
  }
}

function generateUrl(
  domain: string,
  filename: string,
  type: 'private' | 'public' = 'private',
) {
  if (!filename) {
    return '';
  }
  // 同一进程内优先复用已生成的私有下载链接，避免每次调用都产生不同签名 URL。
  const cached = privateUrlCache.get(filename);

  if (cached) {
    return cached;
  }

  // 生成私有下载链接：deadline 是 Unix 秒级时间戳，超过后链接失效。
  const url = getUrlFromBucket(domain, filename, type);
  privateUrlCache.set(filename, url);
  return url;
}

// ---- Public API ----

export function getPrivateUrl(filename: string) {
  const ossInfo = ossInfoMap.get('photo');
  if (!ossInfo) {
    return '';
  }
  return generateUrl(ossInfo.domain, filename);
}

export async function deleteFile(filename: string) {
  const ossInfo = ossInfoMap.get('photo');
  if (!ossInfo) {
    return false;
  }
  return deleteOssFile(ossInfo.bucket, filename);
}

export function getArticleUrl(filename: string) {
  const ossInfo = ossInfoMap.get('article');
  if (!ossInfo) {
    return '';
  }
  // 文章文件的私有下载链接与普通文件不同，需要使用不同的域名和存储桶。
  return generateUrl(ossInfo.domain, filename, 'public');
}

export async function deleteArticleFile(filename: string) {
  const ossInfo = ossInfoMap.get('article');
  if (!ossInfo) {
    return false;
  }
  return deleteOssFile(ossInfo.bucket, filename);
}

export function getBucket(type: 'article' | 'photo') {
  const ossInfo = ossInfoMap.get(type);
  if (!ossInfo) {
    return '';
  }
  return ossInfo.bucket;
}

export const ossService = {
  getPrivateUrl,
  deleteFile,
  getArticleUrl,
  deleteArticleFile,
  getBucket,
};
