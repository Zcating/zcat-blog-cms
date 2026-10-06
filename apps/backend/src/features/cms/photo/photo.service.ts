import { Effect } from 'effect';

import { OssService, PrismaService, tryPromise } from '../../../common/effect';

import { PhotoResponseDtoSchema } from './photo.schema';

type PhotoRow = {
  id: number;
  name: string;
  url: string;
  thumbnailUrl: string;
  albumId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function transformPhoto(oss: OssService, photo: PhotoRow) {
  return tryPromise(async () => {
    const [signedUrl, signedThumbnailUrl] = await Promise.all([
      oss.presignDownloadUrl(photo.url),
      oss.presignDownloadUrl(photo.thumbnailUrl),
    ]);
    return PhotoResponseDtoSchema.parse({
      ...photo,
      signedUrl,
      signedThumbnailUrl,
    });
  });
}

function transformPhotos(oss: OssService, photos: PhotoRow[]) {
  return Effect.all(
    photos.map((photo) => transformPhoto(oss, photo)),
    { concurrency: 'unbounded' },
  );
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
    const data = yield* transformPhotos(oss, photos);

    return {
      data,
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
    return yield* transformPhotos(oss, photos);
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
    return yield* transformPhoto(oss, photo);
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
    return yield* transformPhoto(oss, photo);
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
    return yield* transformPhoto(oss, photo);
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
    const photo = yield* transformPhoto(oss, updatedPhoto);

    return {
      ...photo,
      albumId,
      isCover: data.isCover,
    };
  });
}

export function deleteById(id: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const photo = yield* tryPromise(() =>
      prisma.photo.findUnique({ where: { id } }),
    );

    if (!photo) {
      return false;
    }

    const oss = yield* OssService;
    const deletedObjects = yield* Effect.all(
      [
        tryPromise(() => oss.deleteFile(photo.url)),
        tryPromise(() => oss.deleteFile(photo.thumbnailUrl)),
      ],
      { concurrency: 'unbounded' },
    );

    if (deletedObjects.some((deleted) => !deleted)) {
      return yield* Effect.fail(new Error('删除照片文件失败，照片记录已保留'));
    }

    yield* tryPromise(() =>
      prisma.$transaction(async (tx) => {
        await tx.photoAlbum.updateMany({
          where: { coverId: id },
          data: { coverId: null },
        });

        await tx.photo.delete({ where: { id } });
      }),
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
