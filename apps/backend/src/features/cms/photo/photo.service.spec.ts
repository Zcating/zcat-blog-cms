import { describe, expect, it, vi } from 'vitest';

const mockPrisma = vi.hoisted(() => ({
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
  },
}));

const mockOssService = vi.hoisted(() => ({
  getPrivateUrl: vi.fn((url: string) => `private-${url}`),
  deleteFile: vi.fn(),
}));

vi.mock('../../../services', () => ({
  prismaService: mockPrisma,
  ossService: mockOssService,
}));

import { photoService } from './photo.service';

describe('photoService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns paginated photos', async () => {
      const photos = [
        { id: 1, url: 'u1', thumbnailUrl: 't1', name: 'Photo 1' },
      ];
      mockPrisma.photo.findMany.mockResolvedValue(photos);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await photoService.findAll(undefined, 1, 10);

      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(mockPrisma.photo.findMany).toHaveBeenCalled();
    });

    it('returns empty when albumId is invalid (<= 0)', async () => {
      const result = await photoService.findAll(0, 1, 10);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
      expect(mockPrisma.photo.findMany).not.toHaveBeenCalled();
    });

    it('filters by albumId', async () => {
      mockPrisma.photo.findMany.mockResolvedValue([]);
      mockPrisma.photo.count.mockResolvedValue(0);

      await photoService.findAll(5, 1, 10);

      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { albumId: 5 },
        }),
      );
    });

    it('transforms photo URLs', async () => {
      const photos = [
        { id: 1, url: 'orig', thumbnailUrl: 'orig-t', name: 'P1' },
      ];
      mockPrisma.photo.findMany.mockResolvedValue(photos);
      mockPrisma.photo.count.mockResolvedValue(1);

      const result = await photoService.findAll(undefined, 1, 10);

      expect(result.data[0].url).toBe('private-orig');
      expect(result.data[0].thumbnailUrl).toBe('private-orig-t');
    });
  });

  describe('findEmptyAlbum', () => {
    it('returns photos with null albumId', async () => {
      const photos = [{ id: 1, url: 'u', thumbnailUrl: 't', name: 'P1' }];
      mockPrisma.photo.findMany.mockResolvedValue(photos);

      const result = await photoService.findEmptyAlbum();

      expect(result).toHaveLength(1);
      expect(mockPrisma.photo.findMany).toHaveBeenCalledWith({
        where: { albumId: null },
      });
    });
  });

  describe('findById', () => {
    it('returns photo when found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        url: 'u',
        thumbnailUrl: 't',
      });

      const result = await photoService.findById(1);

      expect(result).not.toBeNull();
      expect(result!.url).toBe('private-u');
    });

    it('returns null when not found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const result = await photoService.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a photo with default values', async () => {
      mockPrisma.photo.create.mockResolvedValue({
        id: 1,
        name: '',
        url: 'u',
        thumbnailUrl: 't',
        albumId: null,
      });

      const result = await photoService.create({
        name: '',
        url: 'u',
        thumbnailUrl: 't',
      });

      expect(mockPrisma.photo.create).toHaveBeenCalledWith({
        data: {
          name: '',
          url: 'u',
          thumbnailUrl: 't',
          albumId: undefined,
        },
      });
      expect(result.url).toBe('private-u');
    });

    it('creates a photo with albumId', async () => {
      mockPrisma.photo.create.mockResolvedValue({
        id: 2,
        name: 'P',
        url: 'u',
        thumbnailUrl: 't',
        albumId: 1,
      });

      const result = await photoService.create({
        name: 'P',
        url: 'u',
        thumbnailUrl: 't',
        albumId: 1,
      });

      expect(result.albumId).toBe(1);
    });
  });

  describe('update', () => {
    it('updates a photo', async () => {
      mockPrisma.photo.update.mockResolvedValue({
        id: 1,
        url: 'u',
        thumbnailUrl: 't',
      });

      const result = await photoService.update(1, { name: 'Updated' });

      expect(result).not.toBeNull();
      expect(mockPrisma.photo.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { name: 'Updated' },
      });
    });
  });

  describe('updateWithAlbum', () => {
    it('updates album cover when isCover is true', async () => {
      mockPrisma.photoAlbum.update.mockResolvedValue({ id: 1 });
      mockPrisma.photo.update.mockResolvedValue({
        id: 1,
        name: 'P',
        url: 'u',
        thumbnailUrl: 't',
      });

      const result = await photoService.updateWithAlbum(1, 1, {
        name: 'P',
        isCover: true,
      });

      expect(mockPrisma.photoAlbum.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { coverId: 1 },
      });
      expect(result.isCover).toBe(true);
    });

    it('skips cover update when isCover is not set', async () => {
      mockPrisma.photo.update.mockResolvedValue({
        id: 1,
        name: 'P',
        url: 'u',
        thumbnailUrl: 't',
      });

      await photoService.updateWithAlbum(1, 1, { name: 'P' });

      expect(mockPrisma.photoAlbum.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes photo when found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue({
        id: 1,
        url: 'u',
        thumbnailUrl: 't',
      });
      mockPrisma.photo.delete.mockResolvedValue({ id: 1 });

      const result = await photoService.delete(1);

      expect(result).toBe(true);
      expect(mockOssService.deleteFile).toHaveBeenCalledTimes(2);
    });

    it('returns false when photo not found', async () => {
      mockPrisma.photo.findUnique.mockResolvedValue(null);

      const result = await photoService.delete(999);

      expect(result).toBe(false);
      expect(mockPrisma.photo.delete).not.toHaveBeenCalled();
    });
  });
});
