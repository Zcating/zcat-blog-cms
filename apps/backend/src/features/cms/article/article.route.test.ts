import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

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
      mockArticleService.findAll.mockResolvedValue({ data: [], total: 0 });
      const app = createApp();

      const res = await app.request('/articles');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('throws on service error', async () => {
      mockArticleService.findAll.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/articles');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /articles/detail', () => {
    it('returns article detail', async () => {
      mockArticleService.findById.mockResolvedValue({ id: 1, title: 'A' });
      const app = createApp();

      const res = await app.request('/articles/detail?id=1');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.title).toBe('A');
    });

    it('returns database error when article not found', async () => {
      mockArticleService.findById.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/articles/detail?id=1');
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });
  });

  describe('POST /articles/create', () => {
    it('creates article', async () => {
      mockArticleService.create.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'T',
          excerpt: 'E',
          content: 'C',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on failure', async () => {
      mockArticleService.create.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/articles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'T',
          excerpt: 'E',
          content: 'C',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /articles/update', () => {
    it('updates article', async () => {
      mockArticleService.update.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, title: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on failure', async () => {
      mockArticleService.update.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/articles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /articles/delete', () => {
    it('deletes article', async () => {
      mockArticleService.delete.mockResolvedValue(true);
      const app = createApp();

      const res = await app.request('/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when delete fails', async () => {
      mockArticleService.delete.mockResolvedValue(false);
      const app = createApp();

      const res = await app.request('/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });

    it('returns error on exception', async () => {
      mockArticleService.delete.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/articles/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /articles/upload-images', () => {
    it('returns upload urls', async () => {
      mockArticleService.getUploadUrls.mockReturnValue(['url1']);
      const app = createApp();

      const res = await app.request('/articles/upload-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: ['img1'] }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toEqual(['url1']);
    });

    it('returns error on failure', async () => {
      mockArticleService.getUploadUrls.mockImplementation(() => {
        throw new Error('fail');
      });
      const app = createApp();

      const res = await app.request('/articles/upload-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: ['img1'] }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
