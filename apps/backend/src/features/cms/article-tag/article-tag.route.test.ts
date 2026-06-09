import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

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
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', articleTagRoutes);
  return app;
};

describe('articleTagRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /article-tags', () => {
    it('returns all tags', async () => {
      mockTagService.findAll.mockReturnValue(Effect.succeed([{ id: 1, name: 'tag1' }]));
      const app = createApp();

      const res = await app.request('/article-tags');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toHaveLength(1);
    });

    it('throws on service error', async () => {
      mockTagService.findAll.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/article-tags');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /article-tags/:id', () => {
    it('returns tag by id', async () => {
      mockTagService.findById.mockReturnValue(Effect.succeed({ id: 1, name: 'tag' }));
      const app = createApp();

      const res = await app.request('/article-tags/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('throws on service error', async () => {
      mockTagService.findById.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/article-tags/1');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /article-tags', () => {
    it('creates a tag', async () => {
      mockTagService.create.mockReturnValue(Effect.succeed({ id: 1, name: 'new' }));
      const app = createApp();

      const res = await app.request('/article-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on service exception', async () => {
      mockTagService.create.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/article-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'new' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('PUT /article-tags/:id', () => {
    it('updates a tag', async () => {
      mockTagService.update.mockReturnValue(Effect.succeed({ id: 1, name: 'updated' }));
      const app = createApp();

      const res = await app.request('/article-tags/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on not found', async () => {
      mockTagService.update.mockReturnValue(Effect.fail(new Error('not found')));
      const app = createApp();

      const res = await app.request('/article-tags/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0003');
    });
  });

  describe('DELETE /article-tags/:id', () => {
    it('deletes a tag', async () => {
      mockTagService.delete.mockReturnValue(Effect.succeed(undefined));
      const app = createApp();

      const res = await app.request('/article-tags/1', {
        method: 'DELETE',
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error on service exception', async () => {
      mockTagService.delete.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/article-tags/1', {
        method: 'DELETE',
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});