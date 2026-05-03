import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { OssStrategy, OssType } from './oss.strategy';

class MockMinioClient {
  presignedUrl = vi
    .fn()
    .mockResolvedValue('https://mock-presigned-url.com/file');
  removeObject = vi.fn().mockResolvedValue(undefined);
  bucketExists = vi.fn().mockResolvedValue(true);
}

vi.mock('minio', () => ({
  __esModule: true,
  default: {
    Client: MockMinioClient,
  },
  Client: MockMinioClient,
}));

const mockEnv = {
  MINIO_ENDPOINT: 'localhost',
  MINIO_PORT: '9000',
  MINIO_USE_SSL: 'false',
  MINIO_ACCESS_KEY: 'test-access-key',
  MINIO_SECRET_KEY: 'test-secret-key',
  MINIO_PHOTO_BUCKET: 'photo-bucket',
  MINIO_PHOTO_DOMAIN: 'photo.example.com',
  MINIO_ARTICLE_BUCKET: 'article-bucket',
  MINIO_ARTICLE_DOMAIN: 'article.example.com',
};

describe('MinioStrategy', () => {
  let MockClient: typeof MockMinioClient;

  beforeAll(() => {
    Object.assign(process.env, mockEnv);
    MockClient = MockMinioClient;
  });

  afterAll(() => {
    Object.keys(mockEnv).forEach((key) => {
      delete process.env[key];
    });
  });

  beforeEach(async () => {
    vi.resetModules();
    Object.assign(process.env, mockEnv);

    MockClient.prototype.presignedUrl = vi
      .fn()
      .mockResolvedValue('https://mock-presigned-url.com/file');
    MockClient.prototype.removeObject = vi.fn().mockResolvedValue(undefined);
    MockClient.prototype.bucketExists = vi.fn().mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createMinioStrategy', () => {
    it('should create a valid OssStrategy', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
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
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.getPrivateUrl('test-file.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });

    it('should return Promise<string> for article type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.getPrivateUrl('article-cover.jpg', 'article');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });
  });

  describe('deleteFile', () => {
    it('should return Promise<void> for photo type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.deleteFile('test-file.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    it('should return Promise<void> for article type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.deleteFile('article-file.jpg', 'article');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getArticleUrl', () => {
    it('should return Promise<string>', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.getArticleUrl('article-cover.jpg');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });
  });

  describe('deleteArticleFile', () => {
    it('should return Promise<void>', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const result = strategy.deleteArticleFile('article-img.jpg');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getBucket', () => {
    it('should return bucket name for photo type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const bucket = strategy.getBucket('photo');
      expect(bucket).toBe('photo-bucket');
    });

    it('should return bucket name for article type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const bucket = strategy.getBucket('article');
      expect(bucket).toBe('article-bucket');
    });
  });

  describe('getUploadToken', () => {
    it('should return upload token for photo type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const token = strategy.getUploadToken('photo');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should return upload token for article type', async () => {
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
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
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      const url = await strategy.getPrivateUrl('test.jpg', 'photo');
      expect(url).toBe('');

      Object.assign(process.env, originalEnv);
    });

    it('should handle delete errors gracefully', async () => {
      MockClient.prototype.removeObject = vi
        .fn()
        .mockRejectedValue(new Error('Delete failed'));
      const { createMinioStrategy } = await import('./minio.strategy');
      const strategy = createMinioStrategy();
      await expect(
        strategy.deleteFile('test.jpg', 'photo'),
      ).resolves.toBeUndefined();
    });
  });
});
