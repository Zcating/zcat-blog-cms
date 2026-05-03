import { describe, expect, it } from 'vitest';

import type { OssStrategy, OssType } from './oss.strategy';

describe('OssType', () => {
  it('should be "article" or "photo"', () => {
    const articleType: OssType = 'article';
    const photoType: OssType = 'photo';

    expect(articleType).toBe('article');
    expect(photoType).toBe('photo');
  });

  it('should accept valid types', () => {
    const validTypes: OssType[] = ['article', 'photo'];
    expect(validTypes).toHaveLength(2);
  });
});

describe('OssStrategy 接口契约', () => {
  const createMockStrategy = (): OssStrategy => ({
    getPrivateUrl: async (key: string, type: OssType) =>
      `https://private.${type}.example.com/${key}`,
    deleteFile: async (key: string, type: OssType) => {},
    getArticleUrl: async (key: string) =>
      `https://public.article.example.com/${key}`,
    deleteArticleFile: async (key: string) => {},
    getBucket: (type: OssType) => `${type}-bucket`,
    getUploadToken: (type: OssType) => `token-for-${type}`,
  });

  let strategy: OssStrategy;

  beforeEach(() => {
    strategy = createMockStrategy();
  });

  describe('getPrivateUrl', () => {
    it('should return a Promise<string>', async () => {
      const result = strategy.getPrivateUrl('photo.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });

    it('should include key and type in URL', async () => {
      const url = await strategy.getPrivateUrl('test-key.jpg', 'photo');
      expect(url).toContain('test-key.jpg');
      expect(url).toContain('photo');
    });
  });

  describe('deleteFile', () => {
    it('should return a Promise<void>', async () => {
      const result = strategy.deleteFile('test.jpg', 'photo');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getArticleUrl', () => {
    it('should return a Promise<string>', async () => {
      const result = strategy.getArticleUrl('article-cover.jpg');
      expect(result).toBeInstanceOf(Promise);
      const url = await result;
      expect(typeof url).toBe('string');
    });
  });

  describe('deleteArticleFile', () => {
    it('should return a Promise<void>', async () => {
      const result = strategy.deleteArticleFile('article-img.jpg');
      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('getBucket', () => {
    it('should return string for "article" type', () => {
      const bucket = strategy.getBucket('article');
      expect(typeof bucket).toBe('string');
      expect(bucket).toContain('article');
    });

    it('should return string for "photo" type', () => {
      const bucket = strategy.getBucket('photo');
      expect(typeof bucket).toBe('string');
      expect(bucket).toContain('photo');
    });
  });

  describe('getUploadToken', () => {
    it('should return string for "article" type', () => {
      const token = strategy.getUploadToken('article');
      expect(typeof token).toBe('string');
      expect(token).toContain('article');
    });

    it('should return string for "photo" type', () => {
      const token = strategy.getUploadToken('photo');
      expect(typeof token).toBe('string');
      expect(token).toContain('photo');
    });
  });
});
