import { createPaginate } from '@backend/utils';

import { ossService, prismaService } from '../../../common';

type PhotoWithUrls = {
  url: string;
  thumbnailUrl: string;
};

function transformPhoto<T extends PhotoWithUrls>(
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> & PhotoWithUrls {
  return {
    ...photo,
    url: ossService.getPrivateUrl(photo.url),
    thumbnailUrl: ossService.getPrivateUrl(photo.thumbnailUrl),
  };
}

export async function findAll(page: number, pageSize: number) {
  const [albums, total] = await Promise.all([
    prismaService.photoAlbum.findMany({
      orderBy: { createdAt: 'desc' },
      ...createPaginate(page, pageSize),
    }),
    prismaService.photoAlbum.count(),
  ]);

  const coverIds = albums
    .map((album) => album.coverId)
    .filter((id): id is number => id !== null);

  const covers =
    coverIds.length > 0
      ? await prismaService.photo.findMany({
          where: { id: { in: coverIds } },
        })
      : [];

  const data = albums.map((album) => {
    const foundedCover = covers.find((cover) => cover.id === album.coverId);
    const cover = foundedCover ? transformPhoto(foundedCover) : null;
    return {
      id: album.id,
      name: album.name,
      description: album.description,
      coverId: album.coverId,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      available: album.available,
      cover,
    };
  });

  return {
    data,
    totalPages: Math.ceil(total / pageSize),
    page,
    pageSize,
    total,
  };
}

export function findById(id: string) {
  return prismaService.photoAlbum.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

export function create(data: { name: string; description?: string }) {
  return prismaService.photoAlbum.create({
    data: {
      name: data.name,
      description: data.description ?? '',
    },
  });
}

export function update(
  id: number,
  data: { name?: string; description?: string; available?: boolean },
) {
  return prismaService.photoAlbum.update({
    where: { id },
    data,
  });
}

export function deleteById(id: string) {
  return prismaService.photoAlbum.delete({
    where: { id: parseInt(id, 10) },
  });
}

export async function setCover(albumId: number, photoId: number) {
  await prismaService.photoAlbum.update({
    where: { id: albumId },
    data: { coverId: photoId },
  });
}

export async function addPhotos(albumId: number, photoIds: number[]) {
  const album = await prismaService.photoAlbum.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return false;
  }

  await prismaService.photo.updateMany({
    where: { id: { in: photoIds } },
    data: { albumId },
  });

  return true;
}

export const photoAlbumService = {
  findAll,
  findById,
  create,
  update,
  delete: deleteById,
  setCover,
  addPhotos,
};
