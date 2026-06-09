import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

const mockPrisma = vi.hoisted(() => ({
  article: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photoAlbum: { findMany: vi.fn(), findUnique: vi.fn() },
  photo: { findMany: vi.fn() },
  userInfo: { findUnique: vi.fn() },
}));

const mockOss = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => url || ''),
}));

const mockRecordVisitor = vi.hoisted(() => vi.fn());

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOss,
}));

vi.mock('../../../common/statistic-service', () => ({
  recordVisitor: mockRecordVisitor,
}));

import blogRoutes from './blog.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', blogRoutes);
  return app;
};

describe('blogRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /article/list', () => {
    it('returns article list', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);
      const app = createApp();

      const res = await app.request('/article/list');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when article list fails', async () => {
      mockPrisma.article.findMany.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/article/list');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('GET /article/:id', () => {
    it('returns article detail', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({
        id: 1,
        title: 'Test',
      });
      const app = createApp();

      const res = await app.request('/article/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when id is invalid', async () => {
      const app = createApp();

      const res = await app.request('/article/0');
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });

    it('returns error when article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/article/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });

    it('returns error when article detail fails', async () => {
      mockPrisma.article.findUnique.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/article/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('GET /gallery', () => {
    it('returns gallery list', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns gallery list with albums and covers', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Album 1',
          description: 'Desc 1',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverId: 100,
        },
      ]);
      mockPrisma.photo.findMany.mockResolvedValue([
        { id: 100, url: 'cover.jpg', thumbnailUrl: 'cover_t.jpg' },
      ]);
      mockOss.getPrivateUrl.mockImplementation(
        (url: string) => `https://cdn.example.com/${url}`,
      );
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.data).toHaveLength(1);
    });

    it('returns error when gallery list fails', async () => {
      mockPrisma.photoAlbum.findMany.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('GET /gallery/:id', () => {
    it('returns gallery detail', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({
        id: 1,
        name: 'Gallery',
        coverId: null,
        description: '',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.photo.findMany.mockResolvedValue([]);
      const app = createApp();

      const res = await app.request('/gallery/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns gallery detail with cover photo', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({
        id: 1,
        name: 'Gallery',
        coverId: 10,
        description: 'Has cover',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.photo.findMany.mockResolvedValue([
        { id: 10, url: 'cover.jpg', thumbnailUrl: 'cover_t.jpg' },
        { id: 11, url: 'photo.jpg', thumbnailUrl: 'photo_t.jpg' },
      ]);
      const app = createApp();

      const res = await app.request('/gallery/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.cover).toBeTruthy();
      expect(body.data.photos[0].id).toBe(10);
    });

    it('returns success with null when not found', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/gallery/999');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toBeNull();
    });

    it('returns error when gallery detail fails', async () => {
      mockPrisma.photoAlbum.findUnique.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/gallery/999');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /visitor', () => {
    it('records visitor', async () => {
      mockRecordVisitor.mockReturnValue(Effect.succeed(undefined));
      const app = createApp();

      const res = await app.request('/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath: '/test' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns success even on error', async () => {
      mockRecordVisitor.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath: '/test' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('GET /user-info', () => {
    it('returns user info', async () => {
      const userInfo = {
        name: 'Admin',
        occupation: 'Dev',
        abstract: 'Bio',
        aboutMe: 'Me',
        contact: '{}',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.userInfo.findUnique.mockResolvedValue(userInfo);
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Admin');
    });

    it('returns defaults when user info not found', async () => {
      mockPrisma.userInfo.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('');
    });

    it('returns error when userInfo service fails', async () => {
      mockPrisma.userInfo.findUnique.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});