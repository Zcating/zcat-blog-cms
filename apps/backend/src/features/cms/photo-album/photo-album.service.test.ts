import { describe, expect, it, vi } from 'vitest';

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

const mockOssService = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => `private-${url}`),
}));

mockPrisma.$transaction.mockImplementation(async (callback) =>
  callback(mockPrisma),
);

vi.mock('../../../common', () => ({
  prismaService: mockPrisma,
  ossService: mockOssService,
}));

import { photoAlbumService } from './photo-album.service';

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
      const covers = [{ id: 10, url: 'u', thumbnailUrl: 't' }];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(1);
      mockPrisma.photo.findMany.mockResolvedValue(covers);

      const result = await photoAlbumService.findAll(1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.data[0].cover).toEqual({
        ...covers[0],
        url: 'private-u',
        thumbnailUrl: 'private-t',
      });
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

      const result = await photoAlbumService.findAll(1, 10);

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
        { id: 10, url: 'u10', thumbnailUrl: 't10' },
        { id: 20, url: 'u20', thumbnailUrl: 't20' },
        { id: 30, url: 'u30', thumbnailUrl: 't30' },
      ];

      mockPrisma.photoAlbum.findMany.mockResolvedValue(albums);
      mockPrisma.photoAlbum.count.mockResolvedValue(3);
      // Single batched query for all covers
      mockPrisma.photo.findMany.mockResolvedValue(covers);

      const result = await photoAlbumService.findAll(1, 10);

      expect(result.data).toHaveLength(3);
      expect(result.data[0].cover).toEqual({
        ...covers[0],
        url: 'private-u10',
        thumbnailUrl: 'private-t10',
      });
      expect(result.data[1].cover).toEqual({
        ...covers[1],
        url: 'private-u20',
        thumbnailUrl: 'private-t20',
      });
      expect(result.data[2].cover).toEqual({
        ...covers[2],
        url: 'private-u30',
        thumbnailUrl: 'private-t30',
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

      const result = await photoAlbumService.findById('1');

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

      const result = await photoAlbumService.create({
        name: 'New',
        description: 'Desc',
      });

      expect(result).toEqual(album);
    });

    it('creates an album with default description', async () => {
      mockPrisma.photoAlbum.create.mockResolvedValue({ id: 1 });

      await photoAlbumService.create({ name: 'New' });

      expect(mockPrisma.photoAlbum.create).toHaveBeenCalledWith({
        data: { name: 'New', description: '' },
      });
    });
  });

  describe('update', () => {
    it('updates an album', async () => {
      mockPrisma.photoAlbum.update.mockResolvedValue({ id: 1 });

      const result = await photoAlbumService.update(1, { name: 'Updated' });

      expect(mockPrisma.photoAlbum.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('delete', () => {
    it('deletes album by id', async () => {
      mockPrisma.photoAlbum.delete.mockResolvedValue({ id: 1 });

      await photoAlbumService.delete('1');

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

      await photoAlbumService.setCover(1, 5);

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

      await expect(photoAlbumService.setCover(1, 5)).rejects.toThrow(
        '封面照片必须属于当前相册',
      );
      expect(mockPrisma.photoAlbum.update).not.toHaveBeenCalled();
    });
  });

  describe('addPhotos', () => {
    it('adds photos to album when album exists', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue({ id: 1 });

      const result = await photoAlbumService.addPhotos(1, [1, 2, 3]);

      expect(result).toBe(true);
      expect(mockPrisma.photo.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
        data: { albumId: 1 },
      });
    });

    it('returns false when album does not exist', async () => {
      mockPrisma.photoAlbum.findUnique.mockResolvedValue(null);

      const result = await photoAlbumService.addPhotos(999, [1]);

      expect(result).toBe(false);
      expect(mockPrisma.photo.updateMany).not.toHaveBeenCalled();
    });
  });
});
