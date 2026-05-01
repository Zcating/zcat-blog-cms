import {
  createDate,
  createPrismaServiceMock,
} from '../test-helpers/service-test-helper';

import { PhotoAlbumService } from './photo-album.service';

describe('PhotoAlbumService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let photoService: {
    transformPhoto: ReturnType<typeof vi.fn>;
  };
  let service: PhotoAlbumService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    photoService = {
      transformPhoto: vi.fn((photo: { url: string; thumbnailUrl: string }) => ({
        ...photo,
        url: `private://${photo.url}`,
        thumbnailUrl: `private://${photo.thumbnailUrl}`,
      })),
    };
    service = new PhotoAlbumService(prismaService as any, photoService as any);
  });

  it('findAll returns album list with transformed cover', async () => {
    const now = createDate('2026-04-01T00:00:00.000Z');

    prismaService.photoAlbum.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'first',
        description: 'desc',
        coverId: 7,
        createdAt: now,
        updatedAt: now,
        available: true,
      },
      {
        id: 2,
        name: 'second',
        description: 'desc-2',
        coverId: null,
        createdAt: now,
        updatedAt: now,
        available: false,
      },
    ]);
    prismaService.photoAlbum.count.mockResolvedValue(12);
    prismaService.photo.findMany.mockResolvedValue([
      {
        id: 7,
        name: 'cover',
        url: 'cover.jpg',
        thumbnailUrl: 'cover-thumb.jpg',
        albumId: 1,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    const result = await service.findAll({
      page: 2,
      pageSize: 10,
      order: 'latest',
    } as any);

    expect(prismaService.photoAlbum.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
      skip: 10,
      take: 10,
    });
    expect(prismaService.photo.findMany).toHaveBeenCalledWith({
      where: { id: { in: [7] } },
    });
    expect(photoService.transformPhoto).toHaveBeenCalledTimes(1);
    expect(result.totalPages).toBe(2);
    expect(result.total).toBe(12);
    expect(result.data[0].cover).toEqual({
      id: 7,
      name: 'cover',
      url: 'private://cover.jpg',
      thumbnailUrl: 'private://cover-thumb.jpg',
      albumId: 1,
      createdAt: now,
      updatedAt: now,
    });
    expect(result.data[1].cover).toBeNull();
  });

  it('batchAddPhotos returns false when target album is missing', async () => {
    prismaService.photoAlbum.findUnique.mockResolvedValue(null);

    const result = await service.batchAddPhotos({
      albumId: 99,
      photoIds: [1, 2],
    } as any);

    expect(result).toBe(false);
    expect(prismaService.photo.updateMany).not.toHaveBeenCalled();
  });

  it('batchAddPhotos updates albumId for selected photos', async () => {
    prismaService.photoAlbum.findUnique.mockResolvedValue({
      id: 3,
      name: 'album',
    });
    prismaService.photo.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.batchAddPhotos({
      albumId: 3,
      photoIds: [10, 20],
    } as any);

    expect(prismaService.photo.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: [10, 20],
        },
      },
      data: {
        albumId: 3,
      },
    });
    expect(result).toBe(true);
  });

  it('setCover updates cover id by album id', async () => {
    prismaService.photoAlbum.update.mockResolvedValue({ id: 4, coverId: 8 });

    await service.setCover({ albumId: 4, photoId: 8 } as any);

    expect(prismaService.photoAlbum.update).toHaveBeenCalledWith({
      where: { id: 4 },
      data: {
        coverId: 8,
      },
    });
  });
});
