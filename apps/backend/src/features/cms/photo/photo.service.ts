import { Effect } from 'effect';

import { OssService, PrismaService, tryPromise } from '../../../common/effect';

type PhotoWithUrls = {
  url: string;
  thumbnailUrl: string;
};

function transformPhoto<T extends PhotoWithUrls>(
  oss: { getPrivateUrl: (url: string) => string },
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> & PhotoWithUrls {
  return {
    ...photo,
    url: oss.getPrivateUrl(photo.url),
    thumbnailUrl: oss.getPrivateUrl(photo.thumbnailUrl),
  };
}

export function findAll(
  albumId: number | undefined,
  page: number,
  pageSize: number,
) {
  return Effect.gen(function* () {
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
    const prisma = yield* PrismaService;

    const [photos, total] = yield* Effect.all([
      tryPromise(() =>
        prisma.photo.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
      ),
      tryPromise(() => prisma.photo.count({ where })),
    ]);

    const oss = yield* OssService;

    return {
      data: photos.map((photo) => transformPhoto(oss, photo)),
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      total,
    };
  });
}

export function findEmptyAlbum() {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photos = yield* tryPromise(() =>
      prisma.photo.findMany({ where: { albumId: null } }),
    );

    const oss = yield* OssService;
    return photos.map((photo) => transformPhoto(oss, photo));
  });
}

export function findById(id: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photo = yield* tryPromise(() =>
      prisma.photo.findUnique({ where: { id } }),
    );

    if (!photo) {
      return null;
    }

    const oss = yield* OssService;
    return transformPhoto(oss, photo);
  });
}

export function create(data: {
  name?: string;
  url?: string;
  thumbnailUrl?: string;
  albumId?: number | null;
}) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photo = yield* tryPromise(() =>
      prisma.photo.create({
        data: {
          name: data.name ?? '',
          url: data.url || '',
          thumbnailUrl: data.thumbnailUrl || '',
          albumId: data.albumId,
        },
      }),
    );

    const oss = yield* OssService;
    return transformPhoto(oss, photo);
  });
}

export function update(
  id: number,
  data: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    albumId?: number | null;
  },
) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photo = yield* tryPromise(() =>
      prisma.photo.update({
        where: { id },
        data: {
          name: data.name,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl,
          albumId: data.albumId,
        },
      }),
    );

    const oss = yield* OssService;
    return transformPhoto(oss, photo);
  });
}

export function updateWithAlbum(
  id: number,
  albumId: number,
  data: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    isCover?: boolean;
  },
) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const updatedPhoto = yield* tryPromise(() =>
      prisma.$transaction(async (tx) => {
        const existingPhoto = await tx.photo.findUnique({
          where: { id },
          select: { albumId: true },
        });

        if (existingPhoto && existingPhoto.albumId !== albumId) {
          await tx.photoAlbum.updateMany({
            where: { coverId: id, id: { not: albumId } },
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
      }),
    );

    const oss = yield* OssService;
    return {
      ...transformPhoto(oss, updatedPhoto),
      albumId,
      isCover: data.isCover,
    };
  });
}

export function deleteById(id: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photo = yield* tryPromise(() =>
      prisma.$transaction(async (tx) => {
        const existingPhoto = await tx.photo.findUnique({ where: { id } });

        if (!existingPhoto) {
          return null;
        }

        await tx.photoAlbum.updateMany({
          where: { coverId: id },
          data: { coverId: null },
        });

        await tx.photo.delete({ where: { id } });

        return existingPhoto;
      }),
    );

    if (!photo) {
      return false;
    }

    const oss = yield* OssService;
    yield* Effect.all(
      [
        tryPromise(() => oss.deleteFile(photo.url)),
        tryPromise(() => oss.deleteFile(photo.thumbnailUrl)),
      ],
      { concurrency: 'unbounded' },
    );

    return true;
  });
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
