import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

const mockPrisma = vi.hoisted(() => ({
  article: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  photoAlbum: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
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

import { logger } from '@backend/utils';
import blogRoutes from './blog.route';
import { errorHandler } from '../../../middleware/error-handler';

const capturedInfoArgs: unknown[][] = [];

const createApp = () => {
  const app = new Hono();
  app.onError(errorHandler);
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

    it('reports the grand total of articles next to the derived total page count', async () => {
      mockPrisma.article.findMany.mockResolvedValue([{ id: 1, title: 'A' }]);
      mockPrisma.article.count.mockResolvedValue(23);
      const app = createApp();

      const res = await app.request('/article/list?page=2&pageSize=10');
      const body = await res.json();

      expect(body.data.total).toBe(23);
      expect(body.data.totalPages).toBe(3);
      expect(body.data.page).toBe(2);
      expect(body.data.pageSize).toBe(10);
      expect(body.data.data).toHaveLength(1);
    });

    it('returns the whole pagination result shape and nothing else', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);
      const app = createApp();

      const res = await app.request('/article/list');
      const body = await res.json();

      expect(Object.keys(body.data).sort()).toEqual([
        'data',
        'page',
        'pageSize',
        'total',
        'totalPages',
      ]);
    });

    it('reports zero total pages when no articles exist', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(0);
      const app = createApp();

      const res = await app.request('/article/list');
      const body = await res.json();

      expect(body.data).toEqual({
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('keeps the grand total when the requested page is past the end', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(23);
      const app = createApp();

      const res = await app.request('/article/list?page=99&pageSize=10');
      const body = await res.json();

      expect(body.data).toEqual({
        data: [],
        total: 23,
        totalPages: 3,
        page: 99,
        pageSize: 10,
      });
    });

    it('never reports a non-finite total page count when the page size is zero', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockResolvedValue(5);
      const app = createApp();

      const res = await app.request('/article/list?pageSize=0');
      const body = await res.json();

      expect(body.data.pageSize).toBe(0);
      expect(body.data.total).toBe(5);
      expect(body.data.totalPages).toBe(0);
      expect(Number.isFinite(body.data.totalPages)).toBe(true);
    });

    it('reports an error when the article count fails instead of an empty page', async () => {
      mockPrisma.article.findMany.mockResolvedValue([]);
      mockPrisma.article.count.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/article/list');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
      expect(body.code).not.toBe('0000');
    });

    it('rejects an unknown sort order instead of answering with an empty page', async () => {
      const app = createApp();

      const res = await app.request('/article/list?order=sideways');
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.code).not.toBe('0000');
      expect(body.data).toBeUndefined();
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

      expect(body.code).toBe('ERR0007');
    });

    it('returns error when article not found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/article/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0007');
    });

    it('reports resource-does-not-exist for a missing article without a data payload', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/article/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('keeps a database fault distinguishable from a missing article', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      const absence = await (await createApp().request('/article/1')).json();

      mockPrisma.article.findUnique.mockRejectedValue(new Error('db error'));
      const fault = await (await createApp().request('/article/1')).json();

      expect(absence.code).toBe('ERR0007');
      expect(fault.code).toBe('ERR0006');
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
      mockPrisma.photoAlbum.count.mockResolvedValue(0);
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
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
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

    it('reports the grand total of available albums instead of the current page length', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Album 1',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverId: null,
        },
        {
          id: 2,
          name: 'Album 2',
          description: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          coverId: null,
        },
      ]);
      mockPrisma.photoAlbum.count.mockResolvedValue(7);
      mockPrisma.photo.findMany.mockResolvedValue([]);
      const app = createApp();

      const res = await app.request('/gallery?page=2&pageSize=2');
      const body = await res.json();

      expect(body.data.data).toHaveLength(2);
      expect(body.data.total).toBe(7);
      expect(body.data.total).not.toBe(body.data.data.length);
      expect(body.data.totalPages).toBe(4);
      expect(body.data.page).toBe(2);
      expect(body.data.pageSize).toBe(2);
    });

    it('returns the whole pagination result shape and nothing else', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(0);
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(Object.keys(body.data).sort()).toEqual([
        'data',
        'page',
        'pageSize',
        'total',
        'totalPages',
      ]);
    });

    it('reports zero total pages when no available albums exist', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(0);
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(body.data).toEqual({
        data: [],
        total: 0,
        totalPages: 0,
        page: 1,
        pageSize: 10,
      });
    });

    it('keeps the grand total when the requested page is past the end', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(7);
      const app = createApp();

      const res = await app.request('/gallery?page=5&pageSize=2');
      const body = await res.json();

      expect(body.data).toEqual({
        data: [],
        total: 7,
        totalPages: 4,
        page: 5,
        pageSize: 2,
      });
    });

    it('never reports a non-finite total page count when the page size is zero', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockResolvedValue(5);
      const app = createApp();

      const res = await app.request('/gallery?pageSize=0');
      const body = await res.json();

      expect(body.data.pageSize).toBe(0);
      expect(body.data.total).toBe(5);
      expect(body.data.totalPages).toBe(0);
      expect(Number.isFinite(body.data.totalPages)).toBe(true);
    });

    it('reports an error when the album count fails instead of an empty page', async () => {
      mockPrisma.photoAlbum.findMany.mockResolvedValue([]);
      mockPrisma.photoAlbum.count.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/gallery');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
      expect(body.code).not.toBe('0000');
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

    it('reports resource-does-not-exist for a missing album without a data payload', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/gallery/999');
      const body = await res.json();

      expect(body.code).toBe('ERR0007');
      expect(body).not.toHaveProperty('data');
    });

    it('never puts a null album inside a success envelope', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/gallery/999');
      const body = await res.json();

      expect(body.code).not.toBe('0000');
      expect(body.data ?? null).toBeNull();
    });

    it('keeps a database fault distinguishable from a missing album', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);
      const absence = await (await createApp().request('/gallery/999')).json();

      mockPrisma.photoAlbum.findUnique.mockRejectedValue(new Error('db error'));
      const fault = await (await createApp().request('/gallery/999')).json();

      expect(absence.code).toBe('ERR0007');
      expect(fault.code).toBe('ERR0006');
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

    it('logs the visited page path in the emitted log line', async () => {
      mockRecordVisitor.mockReturnValue(Effect.succeed(undefined));
      const infoSpy = vi
        .spyOn(logger, 'info')
        .mockImplementation((...args: unknown[]) => {
          capturedInfoArgs.push(args);
        });

      const res = await createApp().request('/visitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagePath: '/posts/logged' }),
      });

      expect((await res.json()).code).toBe('0000');
      expect(capturedInfoArgs).toEqual([
        [{ pagePath: '/posts/logged' }, '记录博客访客:'],
      ]);

      infoSpy.mockRestore();
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
