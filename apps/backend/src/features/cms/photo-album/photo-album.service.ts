import { Effect } from 'effect';

import { createPaginate } from '@backend/utils';
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

export function findAll(page: number, pageSize: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const [albums, total] = yield* Effect.all([
      tryPromise(() =>
        prisma.photoAlbum.findMany({
          orderBy: { createdAt: 'desc' },
          ...createPaginate(page, pageSize),
        }),
      ),
      tryPromise(() => prisma.photoAlbum.count()),
    ]);

    const coverIds = albums
      .map((album) => album.coverId)
      .filter((id): id is number => id !== null);

    // 用 Map 一次构建 cover 索引，O(1) 查表代替 O(N) find
    type CoverRow = Awaited<ReturnType<typeof prisma.photo.findMany>>[number];
    const coverMap = new Map<number, CoverRow>();
    if (coverIds.length > 0) {
      const covers: CoverRow[] = yield* tryPromise(() =>
        prisma.photo.findMany({ where: { id: { in: coverIds } } }),
      );
      for (const cover of covers) {
        coverMap.set(cover.id, cover);
      }
    }

    const oss = yield* OssService;
    type AlbumRow = Awaited<
      ReturnType<typeof prisma.photoAlbum.findMany>
    >[number];
    const data = (albums as AlbumRow[]).map((album) => {
      const foundedCover =
        album.coverId !== null ? coverMap.get(album.coverId) : undefined;
      const cover = foundedCover ? transformPhoto(oss, foundedCover) : null;
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
  });
}

export function findById(id: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.photoAlbum.findUnique({ where: { id: parseInt(id, 10) } }),
    );
  });
}

export function create(data: { name: string; description?: string }) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.photoAlbum.create({
        data: {
          name: data.name,
          description: data.description ?? '',
        },
      }),
    );
  });
}

export function update(
  id: number,
  data: { name?: string; description?: string; available?: boolean },
) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.photoAlbum.update({ where: { id }, data }),
    );
  });
}

export function deleteById(id: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    yield* tryPromise(() =>
      prisma.photoAlbum.delete({ where: { id: parseInt(id, 10) } }),
    );
  });
}

export function setCover(albumId: number, photoId: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    yield* tryPromise(() =>
      prisma.$transaction(async (tx) => {
        const photo = await tx.photo.findUnique({
          where: { id: photoId },
          select: { albumId: true },
        });

        if (!photo || photo.albumId !== albumId) {
          throw new Error('封面照片必须属于当前相册');
        }

        await tx.photoAlbum.update({
          where: { id: albumId },
          data: { coverId: photoId },
        });
      }),
    );
  });
}

export function addPhotos(albumId: number, photoIds: number[]) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const album = yield* tryPromise(() =>
      prisma.photoAlbum.findUnique({ where: { id: albumId } }),
    );

    if (!album) {
      return false;
    }

    yield* tryPromise(() =>
      prisma.photo.updateMany({
        where: { id: { in: photoIds } },
        data: { albumId },
      }),
    );

    return true;
  });
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
