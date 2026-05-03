import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.OSS_ACCESS_KEY = 'test-key';
  process.env.OSS_SECRET_KEY = 'test-secret';
  process.env.OSS_PHOTO_BUCKET = 'photo-bucket';
  process.env.OSS_PHOTO_DOMAIN = 'photo.example.com';
  process.env.OSS_ARTICLE_BUCKET = 'article-bucket';
  process.env.OSS_ARTICLE_DOMAIN = 'article.example.com';
});

const mockPrivateDownloadUrl = vi.hoisted(() => vi.fn());
const mockPublicDownloadUrl = vi.hoisted(() => vi.fn());
const mockDelete = vi.hoisted(() => vi.fn());

vi.mock('qiniu', () => ({
  auth: {
    digest: {
      Mac: function MockMac(this: object) {
        return this;
      },
    },
  },
  conf: {
    Config: function MockConfig(this: object) {
      return this;
    },
  },
  rs: {
    BucketManager: function MockBucketManager(this: object) {
      this.privateDownloadUrl = mockPrivateDownloadUrl;
      this.publicDownloadUrl = mockPublicDownloadUrl;
      this.delete = mockDelete;
      return this;
    },
  },
}));

vi.mock('@backend/utils', () => ({
  Cache: class MockCache<T> {
    private store = new Map<string, { value: T; deadline: number }>();
    get(key: string) {
      return this.store.get(key)?.value;
    }
    set(key: string, value: T) {
      this.store.set(key, { value, deadline: Date.now() + 3600000 });
    }
  },
}));

import { ossService } from './oss.service';

describe('ossService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getPrivateUrl', () => {
    it('generates private URL for photo filenames', () => {
      mockPrivateDownloadUrl.mockReturnValue('https://private.url/photo.jpg');

      const url = ossService.getPrivateUrl('photo.jpg');

      expect(url).toBe('https://private.url/photo.jpg');
    });

    it('caches private URLs for the same filename', () => {
      mockPrivateDownloadUrl.mockReturnValue('https://private.url/cached.jpg');

      ossService.getPrivateUrl('cache-test-photo.jpg');
      ossService.getPrivateUrl('cache-test-photo.jpg');

      // Only called once due to caching
      expect(mockPrivateDownloadUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('getArticleUrl', () => {
    it('generates public URL for article filenames', () => {
      mockPublicDownloadUrl.mockReturnValue('https://public.url/article.jpg');

      const url = ossService.getArticleUrl('article.jpg');

      expect(url).toBe('https://public.url/article.jpg');
    });
  });

  describe('deleteFile', () => {
    it('deletes file from photo bucket', async () => {
      mockDelete.mockResolvedValue({});

      const result = await ossService.deleteFile('old-photo.jpg');

      expect(result).toBe(true);
    });

    it('returns false on delete error', async () => {
      mockDelete.mockRejectedValue(new Error('not found'));

      const result = await ossService.deleteFile('missing.jpg');

      expect(result).toBe(false);
    });
  });

  describe('deleteArticleFile', () => {
    it('deletes file from article bucket', async () => {
      mockDelete.mockResolvedValue({});

      const result = await ossService.deleteArticleFile('article.jpg');

      expect(result).toBe(true);
    });
  });

  describe('getBucket', () => {
    it('returns bucket for photo type', () => {
      const bucket = ossService.getBucket('photo');

      expect(bucket).toBe('photo-bucket');
    });

    it('returns bucket for article type', () => {
      const bucket = ossService.getBucket('article');

      expect(bucket).toBe('article-bucket');
    });
  });
});
