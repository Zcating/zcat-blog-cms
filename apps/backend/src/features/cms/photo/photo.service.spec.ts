import {
  createDate,
  createOssServiceMock,
  createPrismaServiceMock,
} from '../test-helpers/service-test-helper';

import { PhotoService } from './photo.service';

function createPhotoFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'photo-name',
    url: 'origin/photo.jpg',
    thumbnailUrl: 'origin/thumb.jpg',
    albumId: 2,
    createdAt: createDate('2026-03-01T00:00:00.000Z'),
    updatedAt: createDate('2026-03-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PhotoService', () => {
  let prismaService: ReturnType<typeof createPrismaServiceMock>;
  let ossService: ReturnType<typeof createOssServiceMock>;
  let service: PhotoService;

  beforeEach(() => {
    prismaService = createPrismaServiceMock();
    ossService = createOssServiceMock();
    service = new PhotoService(prismaService as any, ossService as any);
  });

  it('getPhotos returns empty array when album id is invalid', async () => {
    const result = await service.getPhotos(0);

    expect(result).toEqual([]);
    expect(prismaService.photo.findMany).not.toHaveBeenCalled();
  });

  it('getPhotosWithPagination returns empty pagination result for invalid album id', async () => {
    const result = await service.getPhotosWithPagination({
      albumId: -1,
      page: 1,
      pageSize: 10,
      order: 'latest',
    } as any);

    expect(result).toEqual({
      data: [],
      page: 1,
      pageSize: 10,
      totalPages: 0,
      total: 0,
    });
    expect(prismaService.photo.findMany).not.toHaveBeenCalled();
    expect(prismaService.photo.count).not.toHaveBeenCalled();
  });

  it('getPhotosWithPagination returns paginated data with transformed urls', async () => {
    prismaService.photo.findMany.mockResolvedValue([
      createPhotoFixture({ id: 7, url: 'a.jpg', thumbnailUrl: 'a-thumb.jpg' }),
    ]);
    prismaService.photo.count.mockResolvedValue(3);

    const result = await service.getPhotosWithPagination({
      albumId: 2,
      page: 2,
      pageSize: 2,
      order: 'latest',
    } as any);

    expect(prismaService.photo.findMany).toHaveBeenCalledWith({
      where: { albumId: 2 },
      skip: 2,
      take: 2,
      orderBy: { createdAt: 'desc' },
    });
    expect(prismaService.photo.count).toHaveBeenCalledWith({
      where: { albumId: 2 },
    });
    expect(result).toEqual({
      data: [
        {
          ...createPhotoFixture({
            id: 7,
            url: 'a.jpg',
            thumbnailUrl: 'a-thumb.jpg',
          }),
          url: 'private://a.jpg',
          thumbnailUrl: 'private://a-thumb.jpg',
        },
      ],
      page: 2,
      pageSize: 2,
      totalPages: 2,
      total: 3,
    });
  });

  it('updateAlbumPhoto updates cover first when isCover is true', async () => {
    prismaService.photoAlbum.update.mockResolvedValue({ id: 9 });
    prismaService.photo.update.mockResolvedValue(
      createPhotoFixture({
        id: 11,
        name: 'updated',
        albumId: 9,
        url: 'new.jpg',
        thumbnailUrl: 'new-thumb.jpg',
      }),
    );

    const result = await service.updateAlbumPhoto({
      id: 11,
      name: 'updated',
      isCover: true,
      albumId: 9,
      url: 'new.jpg',
      thumbnailUrl: 'new-thumb.jpg',
    } as any);

    expect(prismaService.photoAlbum.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { coverId: 11 },
    });
    expect(prismaService.photo.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: {
        name: 'updated',
        url: 'new.jpg',
        thumbnailUrl: 'new-thumb.jpg',
        albumId: 9,
      },
    });

    const coverUpdateOrder =
      prismaService.photoAlbum.update.mock.invocationCallOrder[0];
    const photoUpdateOrder =
      prismaService.photo.update.mock.invocationCallOrder[0];
    expect(coverUpdateOrder).toBeLessThan(photoUpdateOrder);

    expect(result).toEqual({
      ...createPhotoFixture({
        id: 11,
        name: 'updated',
        albumId: 9,
        url: 'private://new.jpg',
        thumbnailUrl: 'private://new-thumb.jpg',
      }),
      isCover: true,
    });
  });

  it('deletePhoto returns false when photo is missing', async () => {
    prismaService.photo.findUnique.mockResolvedValue(null);

    const result = await service.deletePhoto(404);

    expect(result).toBe(false);
    expect(ossService.deleteFile).not.toHaveBeenCalled();
    expect(prismaService.photo.delete).not.toHaveBeenCalled();
  });

  it('deletePhoto deletes oss files and db record when photo exists', async () => {
    prismaService.photo.findUnique.mockResolvedValue(
      createPhotoFixture({
        id: 8,
        url: 'to-delete.jpg',
        thumbnailUrl: 'to-delete-thumb.jpg',
      }),
    );
    prismaService.photo.delete.mockResolvedValue({ id: 8 });

    const result = await service.deletePhoto(8);

    expect(ossService.deleteFile).toHaveBeenNthCalledWith(1, 'to-delete.jpg');
    expect(ossService.deleteFile).toHaveBeenNthCalledWith(
      2,
      'to-delete-thumb.jpg',
    );
    expect(prismaService.photo.delete).toHaveBeenCalledWith({
      where: { id: 8 },
    });
    expect(result).toBe(true);
  });

  it('transformPhoto converts url and thumbnailUrl to private urls', () => {
    const result = service.transformPhoto(
      createPhotoFixture({
        url: 'origin.jpg',
        thumbnailUrl: 'origin-thumb.jpg',
      }) as any,
    );

    expect(ossService.getPrivateUrl).toHaveBeenNthCalledWith(1, 'origin.jpg');
    expect(ossService.getPrivateUrl).toHaveBeenNthCalledWith(
      2,
      'origin-thumb.jpg',
    );
    expect(result.url).toBe('private://origin.jpg');
    expect(result.thumbnailUrl).toBe('private://origin-thumb.jpg');
  });
});
