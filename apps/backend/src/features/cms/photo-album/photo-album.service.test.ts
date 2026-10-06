import { describe, expect, it, vi } from 'vitest';

import { appRuntime } from '@backend/common/effect';

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(),
  photoAlbum: {
    findMany: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  photo: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    updateMany: vi.fn(),
  },
}));

mockPrisma.$transaction.mockImplementation(async (callback) =>
  callback(mockPrisma),
);

const mockOssService = vi.hoisted(() => ({
  presignDownloadUrl: vi.fn(
    async (key: string) => `https://signed.example/${key}`,
  ),
  deleteFile: vi.fn(),
}));

vi.mock('../../../common/prisma.service', () => ({
  prismaService: mockPrisma,
}));

vi.mock('../../../common/oss.service', () => ({
  ossService: mockOssService,
}));

import { photoAlbumService } from './photo-album.service';

const coverRow = (id: number, url: string) => ({
  id,
  name: `photo ${id}`,
  url,
  thumbnailUrl: `${url}_t`,
  albumId: 1,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

describe('photoAlbumService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated albums with covers', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album 1',
          description: 'Desc',
          coverId: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
      ];
      const covers = [coverRow(10, 'u')];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue(covers);

      const result = await appRuntime.runPromise(
        photoAlbumService.findAll(1, 10),
      );

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].cover).toEqual({
        ...covers[0],
        signedUrl: 'https://signed.example/u',
        signedThumbnailUrl: 'https://signed.example/u_t',
      });
    });

    it('carries the same presigned read address the photo endpoint emits', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album 1',
          description: 'Desc',
          coverId: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
      ];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue([coverRow(10, 'u')]);

      const result = await appRuntime.runPromise(
        photoAlbumService.findAll(1, 10),
      );

      expect(result.data[0].cover!.signedUrl).toBe('https://signed.example/u');
      expect(result.data[0].cover!.url).toBe('u');
    });

    it('fails the list when a cover address cannot be signed', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album 1',
          description: 'Desc',
          coverId: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
      ];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue([coverRow(10, 'u')]);
      mockOssService.presignDownloadUrl.mockRejectedValueOnce(
        new Error('signing unavailable'),
      );

      await expect(
        appRuntime.runPromise(photoAlbumService.findAll(1, 10)),
      ).rejects.toThrow('signing unavailable');
    });

    it('returns albums without covers when coverId is null', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album 1',
          description: 'Desc',
          coverId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
      ];
      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);

      const result = await appRuntime.runPromise(
        photoAlbumService.findAll(1, 10),
      );

      expect(result.data[0].cover).toBeNull();
      expect(mockPrisma.photo.findMany).not.toHaveBeenCalled();
    });

    // P0 A.13 — Map<id, photo> O(1) lookup instead of O(N) Array.find per album
    it('matches each cover by id across multiple albums via Map lookup', async () => {
      const albums = [
        {
          id: 1,
          name: 'Album 1',
          description: 'D1',
          coverId: 10,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
        {
          id: 2,
          name: 'Album 2',
          description: 'D2',
          coverId: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
        {
          id: 3,
          name: 'Album 3',
          description: 'D3',
          coverId: 30,
          createdAt: new Date(),
          updatedAt: new Date(),
          available: true,
        },
      ];
      const covers = [
        coverRow(10, 'u10'),
        coverRow(20, 'u20'),
        coverRow(30, 'u30'),
      ];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(3);
      // Single batched query for all covers
      mockPrisma.photo.findMany.mockResolvedValue(covers);

      const result = await appRuntime.runPromise(
        photoAlbumService.findAll(1, 10),
      );

      expect(result.data).toHaveLength(3);
      expect(result.data[0].cover).toMatchObject({
        id: 10,
        signedUrl: 'https://signed.example/u10',
      });
      expect(result.data[1].cover).toMatchObject({
        id: 20,
        signedUrl: 'https://signed.example/u20',
      });
      expect(result.data[2].cover).toMatchObject({
        id: 30,
        signedUrl: 'https://signed.example/u30',
      });
      // Exactly one photo.findMany, not one per album
      expect(mockPrisma.photo.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20, 30] } },
      });
    });
  });

  describe('findById', () => {
    it('returns album by id', async () => {
      const album = { id: 1, name: 'Album' };
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(album);

      const result = await appRuntime.runPromise(
        photoAlbumService.findById('1'),
      );

      expect(result).toEqual(album);
      expect(mockPrisma.photoAlbum.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('create', () => {
    it('creates an album with description', async () => {
      const album = { id: 1, name: 'New', description: 'Desc' };
      mockPrisma.photoAlbum.create.mockResolvedValue(album);

      const result = await appRuntime.runPromise(
        photoAlbumService.create({
          name: 'New',
          description: 'Desc',
        }),
      );

      expect(result).toEqual(album);
    });

    it('creates an album with default description', async () => {
      mockPrisma.photoAlbum.create.mockResolvedValue({ id: 1 });

      await appRuntime.runPromise(photoAlbumService.create({ name: 'New' }));

      expect(mockPrisma.photoAlbum.create).toHaveBeenCalledWith({
        data: { name: 'New', description: '' },
      });
    });
  });

  describe('update', () => {
    it('updates an album', async () => {
      mockPrisma.photoAlbum.update.mockResolvedValue({ id: 1 });

      const result = await appRuntime.runPromise(
        photoAlbumService.update(1, { name: 'Updated' }),
      );

      expect(mockPrisma.photoAlbum.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('delete', () => {
    it('deletes album by id', async () => {
      mockPrisma.photoAlbum.delete.mockResolvedValue({ id: 1 });

      await appRuntime.runPromise(photoAlbumService.delete('1'));

      expect(mockPrisma.photoAlbum.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('setCover', () => {
    it('sets album cover photo', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 5,
        albumId: 1,
      });

      await appRuntime.runPromise(photoAlbumService.setCover(1, 5));

      expect(mockPrisma.photoAlbum.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { coverId: 5 },
      });
    });

    it('rejects cover photo that does not belong to the album', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 5,
        albumId: 2,
      });

      await expect(
        appRuntime.runPromise(photoAlbumService.setCover(1, 5)),
      ).rejects.toThrow('封面照片必须属于当前相册');
      expect(mockPrisma.photoAlbum.update).not.toHaveBeenCalled();
    });
  });

  describe('addPhotos', () => {
    it('adds photos to album when album exists', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.photo.updateMany.mockResolvedValue({ count: 3 });

      const result = await appRuntime.runPromise(
        photoAlbumService.addPhotos(1, [1, 2, 3]),
      );

      expect(result).toBe(true);
      expect(mockPrisma.photo.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        data: { albumId: 1 },
      });
    });

    it('returns false when album does not exist', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const result = await appRuntime.runPromise(
        photoAlbumService.addPhotos(999, [1]),
      );

      expect(result).toBe(false);
      expect(mockPrisma.photo.updateMany).not.toHaveBeenCalled();
    });
  });
});
