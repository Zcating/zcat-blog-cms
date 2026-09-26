import { Effect } from 'effect';

import { recordVisitor as recordStatisticVisitor } from '../../../common/statistic-service';
import { OssService, PrismaService, tryPromise } from '../../../common/effect';
import { createPaginateResult } from '@backend/model';
import { createPaginate, safeNumber, safeParse } from '@backend/utils';

const ORDER_MAP = {
  latest: 'desc',
  oldest: 'asc',
} as const;

type PhotoWithUrls = {
  id: number;
  url: string;
  thumbnailUrl: string;
};

function transformPhoto<T extends PhotoWithUrls>(
  oss: { getPrivateUrl: (url: string) => string },
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> &
  Pick<PhotoWithUrls, 'url' | 'thumbnailUrl'> {
  return {
    ...photo,
    url: oss.getPrivateUrl(photo.url),
    thumbnailUrl: oss.getPrivateUrl(photo.thumbnailUrl),
  };
}

export function getArticleList(
  page: number,
  pageSize: number,
  order: keyof typeof ORDER_MAP = 'latest',
) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;

    const articles = yield* tryPromise(() =>
      prisma.article.findMany({
        ...createPaginate(page, pageSize),
        orderBy: {
          publishAt: ORDER_MAP[order],
        },
        include: {
          articleAndArticleTags: {
            include: {
              articleTag: true,
            },
          },
        },
      }),
    );

    const total = yield* tryPromise(() => prisma.article.count());

    return createPaginateResult(articles, total, page, pageSize);
  });
}

export function getArticleDetail(id: string) {
  return Effect.gen(function* () {
    const safeId = safeNumber(id);
    if (!safeId) {
      return null;
    }

    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.article.findUnique({
        where: { id: safeId },
        select: {
          id: true,
          title: true,
          excerpt: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          publishAt: true,
          articleAndArticleTags: true,
        },
      }),
    );
  });
}

export function getGalleryList(page: number, pageSize: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const oss = yield* OssService;

    const albumModels = yield* tryPromise(() =>
      prisma.photoAlbum.findMany({
        ...createPaginate(page, pageSize),
        where: { available: true },
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          coverId: true,
        },
      }),
    );

    const total = yield* tryPromise(() =>
      prisma.photoAlbum.count({ where: { available: true } }),
    );

    let photos: ReturnType<typeof transformPhoto>[] = [];
    if (albumModels.length > 0) {
      const rawPhotos = yield* tryPromise(() =>
        prisma.photo.findMany({
          where: {
            albumId: {
              in: albumModels.map((item) => item.id),
            },
          },
        }),
      );
      photos = rawPhotos.map((photo) => transformPhoto(oss, photo));
    }

    const galleries = albumModels.map((item) => ({
      id: item.id,
      name: item.name,
      cover: photos.find((photo) => photo.id === item.coverId) || null,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return createPaginateResult(galleries, total, page, pageSize);
  });
}

export function getGalleryDetail(id: string) {
  return Effect.gen(function* () {
    const albumId = safeNumber(id);
    const prisma = yield* PrismaService;
    const oss = yield* OssService;

    const album = yield* tryPromise(() =>
      prisma.photoAlbum.findUnique({
        where: { id: albumId },
        select: {
          id: true,
          name: true,
          coverId: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );

    if (!album) {
      return null;
    }

    const rawPhotos = yield* tryPromise(() =>
      prisma.photo.findMany({
        where: { albumId },
      }),
    );
    const photos = rawPhotos.map((photo) => transformPhoto(oss, photo));

    return {
      id: album.id,
      name: album.name,
      cover: photos.find((photo) => photo.id === album.coverId) || null,
      description: album.description,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      photos: photos.sort((a, b) => (a.id === album.coverId ? -1 : 1)),
    };
  });
}

export function recordVisitor(
  visitorDto: {
    pagePath: string;
    pageTitle?: string;
    referrer?: string;
    browser?: string;
    os?: string;
    device?: string;
    deviceId?: string;
    hmac?: string;
  },
  headers: Record<string, string | undefined>,
  ip: string,
) {
  return Effect.gen(function* () {
    // Create a minimal request-like object compatible with recordVisitor
    const request = {
      headers: {
        'data-hash': headers['data-hash'] || '',
        'x-forwarded-for': headers['x-forwarded-for'] || '',
      },
      ip,
      get: (name: string) => headers[name] || '',
    } as any;

    // recordStatisticVisitor is an Effect-returning function; compose via yield*
    yield* recordStatisticVisitor(request, {
      ...visitorDto,
      pageTitle: visitorDto.pageTitle || '',
      referrer: visitorDto.referrer || '',
      browser: visitorDto.browser || '',
      os: visitorDto.os || '',
      device: visitorDto.device || '',
      deviceId: visitorDto.deviceId || '',
      hmac: visitorDto.hmac || '',
    });
  });
}

export function getUserInfo() {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const oss = yield* OssService;

    const userInfo = yield* tryPromise(() =>
      prisma.userInfo.findUnique({
        where: { id: 1 },
        select: {
          name: true,
          occupation: true,
          abstract: true,
          aboutMe: true,
          contact: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );

    return {
      name: userInfo?.name || '',
      occupation: userInfo?.occupation || '',
      abstract: userInfo?.abstract || '',
      aboutMe: userInfo?.aboutMe || '',
      avatar: oss.getPrivateUrl(userInfo?.avatar || ''),
      contact: safeParse<Record<string, string>>(userInfo?.contact, {}),
    };
  });
}

export const blogService = {
  getArticleList,
  getArticleDetail,
  getGalleryList,
  getGalleryDetail,
  recordVisitor,
  getUserInfo,
};
