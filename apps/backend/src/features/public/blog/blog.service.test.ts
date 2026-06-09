import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  article: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
  },
  photoAlbum: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  photo: {
    findMany: vi.fn(),
  },
  userInfo: {
    findUnique: vi.fn(),
  },
}));

const mockOssService = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => `private-${url}`),
}));

const mockRecordVisitor = vi.hoisted(() => vi.fn());

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

vi.mock('../../../common/statistic-service', () => ({
  recordVisitor: mockRecordVisitor,
}));

import { blogService } from './blog.service';

describe('blogService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getArticleList', () => {
    it('returns paginated articles with latest order', async () => {
      const articles = [{ id: 1, title: 'A1', excerpt: 'E1' }];
      mockPrisma.article.findMany.mockResolvedValue(articles);
      mockPrisma.article.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        blogService.getArticleList(1, 10, 'latest'),
      );

      expect(result.data).toEqual(articles);
      expect(result.totalPages).toBe(1);
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishAt: 'desc' },
        }),
      );
    });

    it('uses oldest order', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await appRuntime.runPromise(blogService.getArticleList(1, 10, 'oldest'));

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishAt: 'asc' },
        }),
      );
    });

    it('defaults to latest order', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await appRuntime.runPromise(blogService.getArticleList(1, 10));

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { publishAt: 'desc' },
        }),
      );
    });

    // P0 A.14 — include articleAndArticleTags.articleTag so the list can render tags inline
    it('includes articleAndArticleTags.articleTag in the query', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);

      await appRuntime.runPromise(blogService.getArticleList(1, 10));

      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            articleAndArticleTags: {
              include: {
                articleTag: true,
              },
            },
          },
        }),
      );
    });
  });

  describe('getArticleDetail', () => {
    it('returns article when found', async () => {
      const article = { id: 1, title: 'Detail' };
      mockPrisma.article.findUnique.mockResolvedValue(article);

      const result = await appRuntime.runPromise(blogService.getArticleDetail('1'));

      expect(result).toEqual(article);
    });

    it('returns null when id is invalid (0)', async () => {
      const result = await appRuntime.runPromise(blogService.getArticleDetail('0'));

      expect(result).toBeNull();
    });

    it('returns null when id is non-numeric', async () => {
      const result = await appRuntime.runPromise(blogService.getArticleDetail('abc'));

      expect(result).toBeNull();
    });

    it('returns null when not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(blogService.getArticleDetail('1'));

      expect(result).toBeNull();
    });
  });

  describe('getGalleryList', () => {
    it('returns paginated galleries', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album',
          description: 'Desc',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverId: 10,
        },
      ];
      const photos = [{ id: 10, url: 'u', thumbnailUrl: 't' }];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photo.findMany.mockResolvedValue(photos);

      const result = await appRuntime.runPromise(blogService.getGalleryList(1, 10));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].cover).toBeDefined();
    });

    it('returns galleries without cover when no coverId', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album',
          description: 'Desc',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverId: null,
        },
      ];
      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photo.findMany.mockResolvedValue([]);

      const result = await appRuntime.runPromise(blogService.getGalleryList(1, 10));

      expect(result.data[0].cover).toBeNull();
    });

    it('returns empty photos when no albums', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photo.findMany.mockResolvedValue([]);

      const result = await appRuntime.runPromise(blogService.getGalleryList(1, 10));

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getGalleryDetail', () => {
    it('returns gallery detail when album exists', async () => {
      const album = {
        id: 1,
        name: 'Album',
        coverId: 10,
        description: 'Desc',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const photos = [
        { id: 10, url: 'u', thumbnailUrl: 't' },
        { id: 11, url: 'u2', thumbnailUrl: 't2' },
      ];

      mockPrisma.photoAlbum.findUnique.mockResolvedValue(album);
      mockPrisma.photo.findMany.mockResolvedValue(photos);

      const result = await appRuntime.runPromise(blogService.getGalleryDetail('1'));

      expect(result).toBeDefined();
      expect(result!.photos).toHaveLength(2);
      // Cover photo should be first
      expect(result!.photos[0].id).toBe(10);
    });

    it('returns null when album not found', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(blogService.getGalleryDetail('999'));

      expect(result).toBeNull();
    });
  });

  describe('recordVisitor', () => {
    it('calls recordVisitor from common with constructed request', async () => {
      mockRecordVisitor.mockReturnValue(Effect.succeed(undefined));

      await appRuntime.runPromise(
        blogService.recordVisitor(
          {
            pagePath: '/test',
            pageTitle: 'Test',
            referrer: 'ref',
            browser: 'Chrome',
            os: 'macOS',
            device: 'Desktop',
            deviceId: 'abc',
            hmac: 'hmac-value',
          },
          { 'data-hash': 'hash123', 'x-forwarded-for': '1.2.3.4' },
          '5.6.7.8',
        ),
      );

      expect(mockRecordVisitor).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'data-hash': 'hash123',
          }),
          ip: '5.6.7.8',
        }),
        expect.objectContaining({
          pagePath: '/test',
          browser: 'Chrome',
        }),
      );
    });
  });

  describe('getUserInfo', () => {
    it('returns user info from id 1', async () => {
      const userInfo = {
        name: 'Admin',
        occupation: 'Dev',
        abstract: 'Bio',
        aboutMe: 'About',
        contact: '{"email":"a@b.com"}',
        avatar: 'avatar.jpg',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfo);

      const result = await appRuntime.runPromise(blogService.getUserInfo());

      expect(result.name).toBe('Admin');
      expect(result.contact).toEqual({ email: 'a@b.com' });
      expect(result.avatar).toBe('private-avatar.jpg');
    });

    it('returns defaults when user info not found', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(blogService.getUserInfo());

      expect(result.name).toBe('');
      expect(result.contact).toEqual({});
    });
  });
});
