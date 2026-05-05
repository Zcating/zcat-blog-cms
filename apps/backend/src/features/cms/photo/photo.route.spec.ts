import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockPhotoService = vi.hoisted(() => ({
  findAll: vi.fn(),
  findEmptyAlbum: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateWithAlbum: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./photo.service', () => ({
  photoService: mockPhotoService,
}));

import photoRoutes from './photo.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', photoRoutes);
  return app;
};

describe('photoRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /photos', () => {
    it('returns paginated photos', async () => {
      mockPhotoService.findAll.mockResolvedValue({ data: [], total: 0 });
      const app = createApp();

      const res = await app.request('/photos');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('GET /photos/empty-album', () => {
    it('returns empty album photos', async () => {
      mockPhotoService.findEmptyAlbum.mockResolvedValue([]);
      const app = createApp();

      const res = await app.request('/photos/empty-album');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('GET /photos/detail', () => {
    it('returns photo detail', async () => {
      mockPhotoService.findById.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/photos/detail?id=1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns success with null data when not found', async () => {
      mockPhotoService.findById.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/photos/detail?id=999');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data).toBeNull();
    });
  });

  describe('POST /photos/create', () => {
    it('creates photo', async () => {
      mockPhotoService.create.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/photos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'P',
          url: 'u',
          thumbnailUrl: 't',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('POST /photos/create/with-album', () => {
    it('creates photo with album', async () => {
      mockPhotoService.create.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/photos/create/with-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: 1,
          name: 'P',
          url: 'u',
          thumbnailUrl: 't',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when create with-album service fails', async () => {
      mockPhotoService.create.mockRejectedValue(new Error('create failed'));
      const app = createApp();

      const res = await app.request('/photos/create/with-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          albumId: 1,
          name: 'P',
          url: 'u',
          thumbnailUrl: 't',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photos/update', () => {
    it('updates photo', async () => {
      mockPhotoService.update.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/photos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when update service fails', async () => {
      mockPhotoService.update.mockRejectedValue(new Error('update failed'));
      const app = createApp();

      const res = await app.request('/photos/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photos/update/with-album', () => {
    it('updates photo with album', async () => {
      mockPhotoService.updateWithAlbum.mockResolvedValue({ id: 1 });
      const app = createApp();

      const res = await app.request('/photos/update/with-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          name: 'P',
          isCover: false,
          albumId: 1,
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when service fails', async () => {
      mockPhotoService.updateWithAlbum.mockRejectedValue(
        new Error('update failed'),
      );
      const app = createApp();

      const res = await app.request('/photos/update/with-album', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 1,
          name: 'P',
          isCover: false,
          albumId: 1,
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photos/delete', () => {
    it('deletes photo', async () => {
      mockPhotoService.delete.mockResolvedValue(true);
      const app = createApp();

      const res = await app.request('/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('succeeds even when photo not found', async () => {
      mockPhotoService.delete.mockResolvedValue(false);
      const app = createApp();

      const res = await app.request('/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when delete service fails', async () => {
      mockPhotoService.delete.mockRejectedValue(new Error('delete failed'));
      const app = createApp();

      const res = await app.request('/photos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});
