import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  photo: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  photoAlbum: {
    update: vi.fn(),
    updateMany: vi.fn(),
  },
}));

const mockOssService = vi.hoisted(() => ({
  presignDownloadUrl: vi.fn(
    async (key: string) => `https://signed.example/${key}`,
  ),
  deleteFile: vi.fn(),
}));

mockPrisma.$transaction.mockImplementation(async (callback) =>
  callback(mockPrisma),
);

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

import { photoService } from './photo.service';

const photoRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Photo 1',
  url: 'photos/orig.jpg',
  thumbnailUrl: 'photos/orig_t.jpg',
  albumId: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('photoService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated photos', async () => {
      const photos = [photoRow()];
      mockPrisma.photo.findMany.mockResolvedValue(photos);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        photoService.findAll(undefined, 1, 10),
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.photo.findMany).toHaveBeenCalled();
    });

    it('returns empty when albumId is invalid (<= 0)', async () => {
      const result = await appRuntime.runPromise(
        photoService.findAll(0, 1, 10),
      );

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockPrisma.photo.findMany).not.toHaveBeenCalled();
    });

    it('filters by albumId', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      await appRuntime.runPromise(photoService.findAll(5, 1, 10));

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { albumId: 5 },
        }),
      );
    });

    it('returns the bare object key alongside a presigned read address', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        photoService.findAll(undefined, 1, 10),
      );

      expect(result.data[0]).toEqual({
        id: 1,
        name: 'Photo 1',
        url: 'photos/orig.jpg',
        thumbnailUrl: 'photos/orig_t.jpg',
        albumId: 1,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        signedUrl: 'https://signed.example/photos/orig.jpg',
        signedThumbnailUrl: 'https://signed.example/photos/orig_t.jpg',
      });
      expect(mockOssService.presignDownloadUrl).toHaveBeenCalledWith(
        'photos/orig.jpg',
      );
    });

    it('signs the thumbnail object on its own instead of rewriting the signed original', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        photoService.findAll(undefined, 1, 10),
      );

      expect(mockOssService.presignDownloadUrl).toHaveBeenCalledWith(
        'photos/orig_t.jpg',
      );
      expect(result.data[0].signedThumbnailUrl).not.toBe(
        result.data[0].signedUrl,
      );
    });

    it('does not leak fields the photo DTO does not declare', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([
        photoRow({ leakedInternalColumn: 'secret' }),
      ]);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        photoService.findAll(undefined, 1, 10),
      );

      expect(result.data[0]).not.toHaveProperty('leakedInternalColumn');
    });

    it('fails the list when an address cannot be signed', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([photoRow()]);
      mockPrisma.photo.count.mockResolvedValue(1);
      mockOssService.presignDownloadUrl.mockRejectedValueOnce(
        new Error('signing unavailable'),
      );

      await expect(
        appRuntime.runPromise(photoService.findAll(undefined, 1, 10)),
      ).rejects.toThrow('signing unavailable');
    });
  });

  describe('findEmptyAlbum', () => {
    it('returns photos with null albumId', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([
        photoRow({ albumId: null }),
      ]);

      const result = await appRuntime.runPromise(photoService.findEmptyAlbum());

      expect(result).toHaveLength(1);
      expect(result[0].signedUrl).toBe(
        'https://signed.example/photos/orig.jpg',
      );
      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith({
        where: { albumId: null },
      });
    });
  });

  describe('findById', () => {
    it('returns photo when found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(photoRow());

      const result = await appRuntime.runPromise(photoService.findById(1));

      expect(result).not.toBeNull();
      expect(result!.url).toBe('photos/orig.jpg');
      expect(result!.signedUrl).toBe('https://signed.example/photos/orig.jpg');
    });

    it('returns null when not found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(photoService.findById(999));

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a photo with default values', async () => {
      mockPrisma.photo.create.mockResolvedValue(
        photoRow({ name: '', url: 'u', thumbnailUrl: 't', albumId: null }),
      );

      const result = await appRuntime.runPromise(
        photoService.create({
          name: '',
          url: 'u',
          thumbnailUrl: 't',
        }),
      );

      expect(mockPrisma.photo.create).toHaveBeenCalledWith({
        data: {
          name: '',
          url: 'u',
          thumbnailUrl: 't',
          albumId: undefined,
        },
      });
      expect(result.url).toBe('u');
      expect(result.signedUrl).toBe('https://signed.example/u');
    });

    it('creates a photo with albumId', async () => {
      mockPrisma.photo.create.mockResolvedValue(
        photoRow({ id: 2, name: 'P', url: 'u', thumbnailUrl: 't', albumId: 1 }),
      );

      const result = await appRuntime.runPromise(
        photoService.create({
          name: 'P',
          url: 'u',
          thumbnailUrl: 't',
          albumId: 1,
        }),
      );

      expect(result.albumId).toBe(1);
    });
  });

  describe('update', () => {
    it('updates a photo', async () => {
      mockPrisma.photo.update.mockResolvedValue(
        photoRow({ url: 'u', thumbnailUrl: 't' }),
      );

      const result = await appRuntime.runPromise(
        photoService.update(1, { name: 'Updated' }),
      );

      expect(result).not.toBeNull();
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('updateWithAlbum', () => {
    it('updates album cover when isCover is true', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        albumId: 1,
      });
      mockPrisma.photoAlbum.update.mockResolvedValue({ id: 1 });
      mockPrisma.photo.update.mockResolvedValue(
        photoRow({ name: 'P', url: 'u', thumbnailUrl: 't' }),
      );

      const result = await appRuntime.runPromise(
        photoService.updateWithAlbum(1, 1, {
          name: 'P',
          isCover: true,
        }),
      );

      expect(mockPrisma.photoAlbum.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { coverId: 1 },
      });
      expect(result.isCover).toBe(true);
      expect(result.signedUrl).toBe('https://signed.example/u');
    });

    it('skips cover update when isCover is not set', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        albumId: 1,
      });
      mockPrisma.photo.update.mockResolvedValue(
        photoRow({ name: 'P', url: 'u', thumbnailUrl: 't' }),
      );

      await appRuntime.runPromise(
        photoService.updateWithAlbum(1, 1, { name: 'P' }),
      );

      expect(mockPrisma.photoAlbum.update).not.toHaveBeenCalled();
    });

    it('clears old album cover when moving a cover photo to another album', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(
        photoRow({ id: 1, albumId: 1, url: 'u', thumbnailUrl: 't' }),
      );
      mockPrisma.photo.update.mockResolvedValue(
        photoRow({ name: 'Moved', url: 'u', thumbnailUrl: 't' }),
      );

      await appRuntime.runPromise(
        photoService.updateWithAlbum(1, 2, { name: 'Moved' }),
      );

      expect(mockPrisma.photoAlbum.updateMany).toHaveBeenCalledWith({
        where: { coverId: 1, id: { not: 2 } },
        data: { coverId: null },
      });
    });
  });

  describe('delete', () => {
    it('deletes photo when found', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
      mockOssService.deleteFile.mockResolvedValue(true);
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        url: 'u',
        thumbnailUrl: 't',
      });
      mockPrisma.photo.delete.mockResolvedValue({ id: 1 });

      const result = await appRuntime.runPromise(photoService.delete(1));

      expect(result).toBe(true);
      expect(mockOssService.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('clears cover references before deleting a photo', async () => {
      mockPrisma.$transaction.mockImplementation(async (cb) => cb(mockPrisma));
      mockOssService.deleteFile.mockResolvedValue(true);
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        url: 'u',
        thumbnailUrl: 't',
      });
      mockPrisma.photo.delete.mockResolvedValue({ id: 1 });

      await appRuntime.runPromise(photoService.delete(1));

      expect(mockPrisma.photoAlbum.updateMany).toHaveBeenCalledWith({
        where: { coverId: 1 },
        data: { coverId: null },
      });
    });

    it('returns false when photo not found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(photoService.delete(999));

      expect(result).toBe(false);
      expect(mockPrisma.photo.delete).not.toHaveBeenCalled();
    });
  });
});
