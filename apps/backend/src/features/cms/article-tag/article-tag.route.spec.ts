import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockTagService = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./article-tag.service', () => ({
  articleTagService: mockTagService,
}));

import articleTagRoutes from './article-tag.route';

const createApp = () => {
  const app = new Hono();
  app.route('/', articleTagRoutes);
  return app;
};

describe('articleTagRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cms/article-tags', () => {
    it('returns all tags', async () => {
      mockTagService.findAll.mockResolvedValue([{ id: 1, name: 'tag1' }]);
      const app = createApp();

      const res = await app.request('/api/cms/article-tags');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toHaveLength(1);
    });

    it('throws on service error', async () => {
      mockTagService.findAll.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/api/cms/article-tags');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/cms/article-tags/:id', () => {
    it('returns tag by id', async () => {
      mockTagService.findById.mockResolvedValue({ id: 1, name: 'tag' });
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('throws on service error', async () => {
      mockTagService.findById.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/cms/article-tags', () => {
    it('creates a tag', async () => {
      mockTagService.create.mockResolvedValue({ id: 1, name: 'new' });
      const app = createApp();

      const res = await app.request('/api/cms/article-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on service exception', async () => {
      mockTagService.create.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/api/cms/article-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('PUT /api/cms/article-tags/:id', () => {
    it('updates a tag', async () => {
      mockTagService.update.mockResolvedValue({ id: 1, name: 'updated' });
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on not found', async () => {
      mockTagService.update.mockRejectedValue(new Error('not found'));
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });
  });

  describe('DELETE /api/cms/article-tags/:id', () => {
    it('deletes a tag', async () => {
      mockTagService.delete.mockResolvedValue(undefined);
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1', {
        method: 'DELETE',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on service exception', async () => {
      mockTagService.delete.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/api/cms/article-tags/1', {
        method: 'DELETE',
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
