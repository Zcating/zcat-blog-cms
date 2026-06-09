import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

const mockArticleService = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  getUploadUrls: vi.fn(),
}));

vi.mock('./article.service', () => ({
  articleService: mockArticleService,
}));

import articleRoutes from './article.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', articleRoutes);
  return app;
};

describe('articleRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('returns paginated articles', async () => {
      mockArticleService.findAll.mockReturnValue(Effect.succeed({ data: [], total: 0 }));
      const app = createApp();

      const res = await app.request('/articles');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('throws on service error', async () => {
      mockArticleService.findAll.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/articles');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /articles/detail', () => {
    it('returns article when found', async () => {
      mockArticleService.findById.mockReturnValue(Effect.succeed({ id: 1, title: 'Test' }));
      const app = createApp();

      const res = await app.request('/articles/detail?id=1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns database error when article not found', async () => {
      mockArticleService.findById.mockReturnValue(Effect.succeed(null));
      const app = createApp();

      const res = await app.request('/articles/detail?id=1');
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });
  });

  describe('POST /articles/create', () => {
    it('creates an article', async () => {
      mockArticleService.create.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New', excerpt: 'Exc', content: 'C' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('POST /articles/update', () => {
    it('updates an article', async () => {
      mockArticleService.update.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, title: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('POST /articles/delete', () => {
    it('deletes an article', async () => {
      mockArticleService.delete.mockReturnValue(Effect.succeed(true));
      const app = createApp();

      const res = await app.request('/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('POST /articles/upload-images', () => {
    it('returns upload URLs', async () => {
      mockArticleService.getUploadUrls.mockReturnValue(Effect.succeed(['url1', 'url2']));
      const app = createApp();

      const res = await app.request('/articles/upload-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: ['a', 'b'] }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });
});