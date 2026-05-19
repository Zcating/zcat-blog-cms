import { prismaService, ossService } from '../../../common';

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

export async function findAll(
  albumId: number | undefined,
  page: number,
  pageSize: number,
) {
  if (albumId !== undefined && albumId <= 0) {
    return {
      data: [],
      page,
      pageSize,
      totalPages: 0,
      total: 0,
    };
  }

  const where = albumId !== undefined ? { albumId } : {};

  const [photos, total] = await Promise.all([
    prismaService.photo.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prismaService.photo.count({ where }),
  ]);

  return {
    data: photos.map((photo) => transformPhoto(photo)),
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    total,
  };
}

export async function findEmptyAlbum() {
  const photos = await prismaService.photo.findMany({
    where: { albumId: null },
  });

  return photos.map((photo) => transformPhoto(photo));
}

export async function findById(id: number) {
  const photo = await prismaService.photo.findUnique({
    where: { id },
  });

  if (!photo) {
    return null;
  }

  return transformPhoto(photo);
}

export async function create(data: {
  name?: string;
  url?: string;
  thumbnailUrl?: string;
  albumId?: number | null;
}) {
  const photo = await prismaService.photo.create({
    data: {
      name: data.name ?? '',
      url: data.url || '',
      thumbnailUrl: data.thumbnailUrl || '',
      albumId: data.albumId,
    },
  });

  return transformPhoto(photo);
}

export async function update(
  id: number,
  data: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    albumId?: number | null;
  },
) {
  const photo = await prismaService.photo.update({
    where: { id },
    data: {
      name: data.name,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      albumId: data.albumId,
    },
  });

  return transformPhoto(photo);
}

export async function updateWithAlbum(
  id: number,
  albumId: number,
  data: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    isCover?: boolean;
  },
) {
  const updatedPhoto = await prismaService.$transaction(async (tx) => {
    const existingPhoto = await tx.photo.findUnique({
      where: { id },
      select: { albumId: true },
    });

    if (existingPhoto && existingPhoto.albumId !== albumId) {
      await tx.photoAlbum.updateMany({
        where: {
          coverId: id,
          id: { not: albumId },
        },
        data: { coverId: null },
      });
    }

    const photo = await tx.photo.update({
      where: { id },
      data: {
        name: data.name,
        url: data.url,
        thumbnailUrl: data.thumbnailUrl,
        albumId,
      },
    });

    if (data.isCover) {
      await tx.photoAlbum.update({
        where: { id: albumId },
        data: { coverId: id },
      });
    }

    return photo;
  });

  return {
    ...transformPhoto(updatedPhoto),
    albumId,
    isCover: data.isCover,
  };
}

export async function deleteById(id: number) {
  const photo = await prismaService.$transaction(async (tx) => {
    const existingPhoto = await tx.photo.findUnique({
      where: { id },
    });

    if (!existingPhoto) {
      return null;
    }

    await tx.photoAlbum.updateMany({
      where: { coverId: id },
      data: { coverId: null },
    });

    await tx.photo.delete({
      where: { id },
    });

    return existingPhoto;
  });

  if (!photo) {
    return false;
  }

  await Promise.allSettled([
    ossService.deleteFile(photo.url),
    ossService.deleteFile(photo.thumbnailUrl),
  ]);

  return true;
}

export const photoService = {
  findAll,
  findEmptyAlbum,
  findById,
  create,
  update,
  updateWithAlbum,
  delete: deleteById,
};
