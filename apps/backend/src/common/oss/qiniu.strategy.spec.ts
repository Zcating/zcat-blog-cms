import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { OssStrategy } from './oss.strategy';

class MockMac {
  accessKey: string;
  secretKey: string;
  constructor(accessKey: string, secretKey: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
  }
}

class MockConfig {
  constructor() {}
}

class MockBucketManager {
  privateDownloadUrl = vi
    .fn()
    .mockImplementation((domain: string, filename: string) => {
      return `https://${domain}/${filename}`;
    });
  publicDownloadUrl = vi
    .fn()
    .mockImplementation((domain: string, filename: string) => {
      return `https://${domain}/${filename}`;
    });
  delete = vi.fn().mockResolvedValue(true);
}

class MockPutPolicy {
  uploadToken = vi.fn().mockReturnValue('mock-upload-token');
  constructor(_scope: string) {}
}

class MockCache<T> {
  get = vi.fn().mockReturnValue(null as T | undefined);
  set = vi.fn();
  clear = vi.fn();
  constructor(_maxSize?: number, _defaultTtl?: number) {}
}

vi.mock('qiniu', () => ({
  __esModule: true,
  default: {
    auth: { digest: { Mac: MockMac } },
    conf: { Config: MockConfig },
    rs: {
      BucketManager: MockBucketManager,
      PutPolicy: MockPutPolicy,
    },
  },
  auth: { digest: { Mac: MockMac } },
  conf: { Config: MockConfig },
  rs: {
    BucketManager: MockBucketManager,
    PutPolicy: MockPutPolicy,
  },
}));

vi.mock('@backend/utils', () => ({
  Cache: MockCache,
}));

const mockEnv = {
  OSS_ACCESS_KEY: 'test-access-key',
  OSS_SECRET_KEY: 'test-secret-key',
  OSS_PHOTO_BUCKET: 'photo-bucket',
  OSS_PHOTO_DOMAIN: 'photo.example.com',
  OSS_ARTICLE_BUCKET: 'article-bucket',
  OSS_ARTICLE_DOMAIN: 'article.example.com',
};

describe('QiniuStrategy', () => {
  beforeAll(() => {
    Object.assign(process.env, mockEnv);
  });

  afterAll(() => {
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
  });

  beforeEach(async () => {
    vi.resetModules();
    Object.assign(process.env, mockEnv);

    MockBucketManager.prototype.privateDownloadUrl = vi
      .fn()
      .mockImplementation((domain: string, filename: string) => {
        return `https://${domain}/${filename}`;
      });
    MockBucketManager.prototype.publicDownloadUrl = vi
      .fn()
      .mockImplementation((domain: string, filename: string) => {
        return `https://${domain}/${filename}`;
      });
    MockBucketManager.prototype.delete = vi.fn().mockResolvedValue(true);
    MockPutPolicy.prototype.uploadToken = vi
      .fn()
      .mockReturnValue('mock-upload-token');
    MockCache.prototype.get = vi.fn().mockReturnValue(null);
    MockCache.prototype.set = vi.fn();
    MockCache.prototype.clear = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createQiniuStrategy', () => {
    it('should create a valid OssStrategy', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      expect(strategy).toBeDefined();
      expect(typeof strategy.getPrivateUrl).toBe('function');
      expect(typeof strategy.deleteFile).toBe('function');
      expect(typeof strategy.getArticleUrl).toBe('function');
      expect(typeof strategy.deleteArticleFile).toBe('function');
      expect(typeof strategy.getBucket).toBe('function');
      expect(typeof strategy.getUploadToken).toBe('function');
    });
  });

  describe('getPrivateUrl', () => {
    it('should return Promise<string> for photo type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.getPrivateUrl('test-file.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
      expect(url).toContain('photo.example.com');
    });

    it('should return Promise<string> for article type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.getPrivateUrl('article-cover.jpg', 'article');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });
  });

  describe('deleteFile', () => {
    it('should return Promise<void> for photo type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.deleteFile('test-file.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('should return Promise<void> for article type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.deleteFile('article-file.jpg', 'article');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getArticleUrl', () => {
    it('should return Promise<string>', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.getArticleUrl('article-cover.jpg');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
      expect(url).toContain('article.example.com');
    });
  });

  describe('deleteArticleFile', () => {
    it('should return Promise<void>', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const result = strategy.deleteArticleFile('article-img.jpg');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getBucket', () => {
    it('should return bucket name for photo type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const bucket = strategy.getBucket('photo');
      expect(bucket).toBe('photo-bucket');
    });

    it('should return bucket name for article type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const bucket = strategy.getBucket('article');
      expect(bucket).toBe('article-bucket');
    });
  });

  describe('getUploadToken', () => {
    it('should return upload token for photo type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const token = strategy.getUploadToken('photo');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return upload token for article type', async () => {
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const token = strategy.getUploadToken('article');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should return empty string when bucket not configured', async () => {
      const originalEnv = { ...process.env };
      Object.keys(mockEnv).forEach((key) => {
        delete process.env[key];
      });

      vi.resetModules();
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      const url = await strategy.getPrivateUrl('test.jpg', 'photo');
      expect(url).toBe('');

      Object.assign(process.env, originalEnv);
    });

    it('should handle delete errors gracefully', async () => {
      MockBucketManager.prototype.delete = vi
        .fn()
        .mockRejectedValue(new Error('Delete failed'));
      const { createQiniuStrategy } = await import('./qiniu.strategy');
      const strategy = createQiniuStrategy();
      await expect(
        strategy.deleteFile('test.jpg', 'photo'),
      ).resolves.toBeUndefined();
    });
  });
});
