import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as qiniu from 'qiniu';

// 缓存过期时间 1 小时
const TTL = 3600;
const MAX_CACHE_SIZE = 2000;

@Injectable()
export class OssService {
  private readonly bucketManager: qiniu.rs.BucketManager;
  private readonly domain: string;
  private readonly bucketName: string;
  private readonly privateUrlCache = new Cache<string>(MAX_CACHE_SIZE, TTL);

  constructor(private configService: ConfigService) {
    const accessKey = this.configService.get<string>('OSS_ACCESS_KEY') ?? '';
    const secretKey = this.configService.get<string>('OSS_SECRET_KEY') ?? '';
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);

    this.domain = this.configService.get<string>('OSS_DOMAIN') ?? '';
    this.bucketName = this.configService.get<string>('OSS_BUCKET') ?? '';
  }

  getPrivateUrl(filename: string) {
    if (!filename) {
      return '';
    }
    const now = Math.floor(Date.now() / 1000);
    const cached = this.privateUrlCache.get(filename);
    if (cached) {
      return cached;
    }

    const deadline = now + TTL;
    const url = this.bucketManager.privateDownloadUrl(
      this.domain,
      filename,
      deadline,
    );

    this.privateUrlCache.set(filename, url);

    return url;
  }

  async deleteFile(filename: string) {
    try {
      await this.bucketManager.delete(this.bucketName, filename);
      return true;
    } catch {
      return false;
    }
  }
}

class Cache<T> {
  private readonly cache = new Map<string, { value: T; deadline: number }>();

  constructor(
    private readonly maxSize: number = 1000,
    private readonly ttl: number = 60 * 1000,
  ) {}

  get(key: string): T | undefined {
    const now = this.getCurrentSecond();
    const cached = this.cache.get(key);
    if (cached && now < cached.deadline + 30) {
      return cached.value;
    }
    return undefined;
  }

  set(key: string, value: T) {
    const now = this.getCurrentSecond();
    this.cache.set(key, { value, deadline: now + this.ttl });
    if (this.cache.size > this.maxSize) {
      for (const [key, value] of this.cache) {
        if (now >= value.deadline + 30) {
          this.cache.delete(key);
        }
      }
    }
  }

  private getCurrentSecond() {
    return Math.floor(Date.now() / 1000);
  }
}
