import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockAlbumService = vi.hoisted(() => ({
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  setCover: vi.fn(),
  addPhotos: vi.fn(),
}));

vi.mock('./photo-album.service', () => ({
  photoAlbumService: mockAlbumService,
}));

import photoAlbumRoutes from './photo-album.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', photoAlbumRoutes);
  return app;
};

describe('photoAlbumRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/cms/photo-albums', () => {
    it('returns paginated albums', async () => {
      mockAlbumService.findAll.mockResolvedValue({ data: [] });
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('GET /api/cms/photo-albums/:id', () => {
    it('returns album by id', async () => {
      mockAlbumService.findById.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when service fails', async () => {
      mockAlbumService.findById.mockRejectedValue(new Error('not found'));
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /api/cms/photo-albums', () => {
    it('creates album', async () => {
      mockAlbumService.create.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Album' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when create service fails', async () => {
      mockAlbumService.create.mockRejectedValue(new Error('create failed'));
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Album' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /api/cms/photo-albums/update', () => {
    it('updates album', async () => {
      mockAlbumService.update.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns validation error when id missing', async () => {
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0005');
    });

    it('returns error when update service fails', async () => {
      mockAlbumService.update.mockRejectedValue(new Error('update failed'));
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /api/cms/photo-albums/delete', () => {
    it('deletes album', async () => {
      mockAlbumService.delete.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when delete service fails', async () => {
      mockAlbumService.delete.mockRejectedValue(new Error('delete failed'));
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /api/cms/photo-albums/cover', () => {
    it('sets cover', async () => {
      mockAlbumService.setCover.mockResolvedValue(undefined);
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoId: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when setCover service fails', async () => {
      mockAlbumService.setCover.mockRejectedValue(
        new Error('set cover failed'),
      );
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoId: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /api/cms/photo-albums/add-photos', () => {
    it('adds photos to album', async () => {
      mockAlbumService.addPhotos.mockResolvedValue(true);
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoIds: [1, 2] }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.message).toBe('批量添加照片到相册成功');
    });

    it('returns error when album not found', async () => {
      mockAlbumService.addPhotos.mockResolvedValue(false);
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 999, photoIds: [1] }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0005');
    });

    it('returns error when addPhotos service fails', async () => {
      mockAlbumService.addPhotos.mockRejectedValue(
        new Error('add photos failed'),
      );
      const app = createApp();

      const res = await app.request('/api/cms/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoIds: [1] }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
