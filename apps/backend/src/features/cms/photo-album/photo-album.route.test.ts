import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

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

  describe('GET /photo-albums', () => {
    it('returns paginated albums', async () => {
      mockAlbumService.findAll.mockReturnValue(Effect.succeed({ data: [] }));
      const app = createApp();

      const res = await app.request('/photo-albums');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('GET /photo-albums/:id', () => {
    it('returns album by id', async () => {
      mockAlbumService.findById.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/photo-albums/1');
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when service fails', async () => {
      mockAlbumService.findById.mockReturnValue(Effect.fail(new Error('not found')));
      const app = createApp();

      const res = await app.request('/photo-albums/1');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photo-albums', () => {
    it('creates album', async () => {
      mockAlbumService.create.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/photo-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Album' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when create service fails', async () => {
      mockAlbumService.create.mockReturnValue(Effect.fail(new Error('create failed')));
      const app = createApp();

      const res = await app.request('/photo-albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Album' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photo-albums/update', () => {
    it('updates album', async () => {
      mockAlbumService.update.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns validation error when id missing', async () => {
      const app = createApp();

      const res = await app.request('/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0005');
    });

    it('returns error when update service fails', async () => {
      mockAlbumService.update.mockReturnValue(Effect.fail(new Error('update failed')));
      const app = createApp();

      const res = await app.request('/photo-albums/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photo-albums/delete', () => {
    it('deletes album', async () => {
      mockAlbumService.delete.mockReturnValue(Effect.succeed({ id: 1 }));
      const app = createApp();

      const res = await app.request('/photo-albums/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when delete service fails', async () => {
      mockAlbumService.delete.mockReturnValue(Effect.fail(new Error('delete failed')));
      const app = createApp();

      const res = await app.request('/photo-albums/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: '1' }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photo-albums/cover', () => {
    it('sets cover', async () => {
      mockAlbumService.setCover.mockReturnValue(Effect.succeed(undefined));
      const app = createApp();

      const res = await app.request('/photo-albums/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoId: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns error when setCover service fails', async () => {
      mockAlbumService.setCover.mockReturnValue(Effect.fail(new Error('set cover failed')));
      const app = createApp();

      const res = await app.request('/photo-albums/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoId: 1 }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /photo-albums/add-photos', () => {
    it('adds photos to album', async () => {
      mockAlbumService.addPhotos.mockReturnValue(Effect.succeed(true));
      const app = createApp();

      const res = await app.request('/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoIds: [1, 2] }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.message).toBe('批量添加照片到相册成功');
    });

    it('returns error when album not found', async () => {
      mockAlbumService.addPhotos.mockReturnValue(Effect.succeed(false));
      const app = createApp();

      const res = await app.request('/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 999, photoIds: [1] }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0005');
    });

    it('returns error when addPhotos service fails', async () => {
      mockAlbumService.addPhotos.mockReturnValue(Effect.fail(new Error('add photos failed')));
      const app = createApp();

      const res = await app.request('/photo-albums/add-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ albumId: 1, photoIds: [1] }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});