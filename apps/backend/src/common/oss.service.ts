import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as qiniu from 'qiniu';

// 私有下载链接签名有效期（单位：秒）。
const TTL = 3600;
// 缓存上限（按 key 数量计），避免进程长期运行时无限增长。
const MAX_CACHE_SIZE = 2000;

type OssType = 'article' | 'photo';
interface OssInfo {
  bucket: string;
  domain: string;
}

@Injectable()
export class OssService {
  private readonly bucketManager: qiniu.rs.BucketManager;
  private readonly ossInfoMap = new Map<OssType, OssInfo>();
  // 缓存 filename -> 私有下载链接，保证同一资源在 TTL 内返回稳定 URL，减少前端重复请求。
  private readonly privateUrlCache = new Cache<string>(MAX_CACHE_SIZE, TTL);

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);

    this.ossInfoMap.set('photo', {
      bucket: this.configService.get<string>('OSS_PHOTO_BUCKET') ?? '',
      domain: this.configService.get<string>('OSS_PHOTO_DOMAIN') ?? '',
    });

    this.ossInfoMap.set('article', {
      bucket: this.configService.get<string>('OSS_ARTICLE_BUCKET') ?? '',
      domain: this.configService.get<string>('OSS_ARTICLE_DOMAIN') ?? '',
    });
  }

  getPrivateUrl(filename: string) {
    const ossInfo = this.ossInfoMap.get('photo');
    if (!ossInfo) {
      return '';
    }
    return this.generateUrl(ossInfo.domain, filename);
  }

  async deleteFile(filename: string) {
    const ossInfo = this.ossInfoMap.get('photo');
    if (!ossInfo) {
      return false;
    }
    return this.deleteOssFile(ossInfo.bucket, filename);
  }

  getArticleUrl(filename: string) {
    const ossInfo = this.ossInfoMap.get('article');
    if (!ossInfo) {
      return '';
    }
    // 文章文件的私有下载链接与普通文件不同，需要使用不同的域名和存储桶。
    return this.generateUrl(ossInfo.domain, filename, 'public');
  }

  async deleteArticleFile(filename: string) {
    const ossInfo = this.ossInfoMap.get('article');
    if (!ossInfo) {
      return false;
    }
    return this.deleteOssFile(ossInfo.bucket, filename);
  }

  getBucket(type: 'article' | 'photo') {
    const ossInfo = this.ossInfoMap.get(type);
    if (!ossInfo) {
      return '';
    }
    return ossInfo.bucket;
  }

  private generateUrl(
    domain: string,
    filename: string,
    type: 'private' | 'public' = 'private',
  ) {
    if (!filename) {
      return '';
    }
    // 同一进程内优先复用已生成的私有下载链接，避免每次调用都产生不同签名 URL。
    const now = Math.floor(Date.now() / 1000);
    const cached = this.privateUrlCache.get(filename);
    if (cached) {
      return cached;
    }

    // 生成私有下载链接：deadline 是 Unix 秒级时间戳，超过后链接失效。
    switch (type) {
      case 'public':
        return this.bucketManager.publicDownloadUrl(domain, filename);
      case 'private':
      default: {
        const deadline = now + TTL;
        return this.bucketManager.privateDownloadUrl(
          domain,
          filename,
          deadline,
        );
      }
    }
  }

  private async deleteOssFile(bucketName: string, filename: string) {
    try {
      await this.bucketManager.delete(bucketName, filename);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * 简单的 TTL 缓存：每个 key 记录 value 与过期时间戳（秒）。
 * @class Cache
 * @template T 缓存值的类型
 * @description 简单的 TTL 缓存实现，用于存储临时数据，如私有下载链接。
 * @param maxSize 缓存上限（按 key 数量计），避免进程长期运行时无限增长。
 * @param ttl 过期时长（单位：秒）
 */
class Cache<T> {
  // 缓存数据结构：key -> { value, deadline }
  private readonly cache = new Map<string, { value: T; deadline: number }>();

  // 提前刷新时间（单位：秒），避免过期后立即请求导致缓存击穿。
  private readonly refreshAheadSeconds = 60;

  constructor(
    // 缓存上限（按 key 数量计），避免进程长期运行时无限增长。
    private readonly maxSize: number = 1000,
    // 过期时长（单位：秒）
    private readonly ttl: number = 60,
  ) {}

  get(key: string): T | undefined {
    const now = this.getCurrentSecond();
    const cached = this.cache.get(key);
    if (!cached) {
      return undefined;
    }

    if (now >= cached.deadline - this.refreshAheadSeconds) {
      this.cache.delete(key);
      return undefined;
    }

    // this.cache.delete(key);
    // this.cache.set(key, cached);

    return cached.value;
  }

  set(key: string, value: T) {
    const now = this.getCurrentSecond();
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, { value, deadline: now + this.ttl });

    // 缓存超过上限时，删除过期项（FIFO）。
    if (this.cache.size <= this.maxSize) {
      return;
    }

    for (const [cacheKey, entry] of this.cache) {
      if (now >= entry.deadline - this.refreshAheadSeconds) {
        this.cache.delete(cacheKey);
      }
    }

    // 缓存超过上限时，删除最旧项（FIFO）。
    if (this.cache.size <= this.maxSize) {
      return;
    }

    // 缓存超过上限时，删除最旧项（FIFO）。
    const oldestKey = this.cache.keys().next();
    if (oldestKey.value) {
      this.cache.delete(oldestKey.value);
    }
  }

  private getCurrentSecond() {
    return Math.floor(Date.now() / 1000);
  }
}
