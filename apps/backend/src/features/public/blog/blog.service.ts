import {
  recordVisitor as recordStatisticVisitor,
  ossService,
  prismaService,
} from '@backend/common';
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
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> &
  Pick<PhotoWithUrls, 'url' | 'thumbnailUrl'> {
  return {
    ...photo,
    url: ossService.getPrivateUrl(photo.url),
    thumbnailUrl: ossService.getPrivateUrl(photo.thumbnailUrl),
  };
}

async function photoFindMany(
  args: Parameters<typeof prismaService.photo.findMany>[0],
) {
  const photos = await prismaService.photo.findMany(args);
  return photos.map((photo) => transformPhoto(photo));
}

export async function getArticleList(
  page: number,
  pageSize: number,
  order: keyof typeof ORDER_MAP = 'latest',
) {
  const articles = await prismaService.article.findMany({
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
  });

  const total = await prismaService.article.count();

  return {
    data: articles,
    totalPages: Math.ceil(total / pageSize),
    page,
    pageSize,
  };
}

export async function getArticleDetail(id: string) {
  const safeId = safeNumber(id);
  if (!safeId) {
    return null;
  }

  return prismaService.article.findUnique({
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
  });
}

export async function getGalleryList(page: number, pageSize: number) {
  const albumModels = await prismaService.photoAlbum.findMany({
    ...createPaginate(page, pageSize),
    where: {
      available: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      coverId: true,
    },
  });

  const photos =
    albumModels.length > 0
      ? await photoFindMany({
          where: {
            albumId: {
              in: albumModels.map((item) => item.id),
            },
          },
        })
      : [];

  const galleries = albumModels.map((item) => ({
    id: item.id,
    name: item.name,
    cover: photos.find((photo) => photo.id === item.coverId) || null,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return {
    data: galleries,
    total: galleries.length,
    page,
    pageSize,
  };
}

export async function getGalleryDetail(id: string) {
  const albumId = safeNumber(id);

  const album = await prismaService.photoAlbum.findUnique({
    where: { id: albumId },
    select: {
      id: true,
      name: true,
      coverId: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!album) {
    return null;
  }

  const photos = await photoFindMany({
    where: {
      albumId,
    },
  });

  return {
    id: album.id,
    name: album.name,
    cover: photos.find((photo) => photo.id === album.coverId) || null,
    description: album.description,
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
    photos: photos.sort((a) => (a.id === album.coverId ? -1 : 1)),
  };
}

export async function recordVisitor(
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
  const request = {
    headers: {
      'data-hash': headers['data-hash'] || '',
      'x-forwarded-for': headers['x-forwarded-for'] || '',
    },
    ip,
    get: (name: string) => headers[name] || '',
  } as any;

  await recordStatisticVisitor(request, {
    ...visitorDto,
    pageTitle: visitorDto.pageTitle || '',
    referrer: visitorDto.referrer || '',
    browser: visitorDto.browser || '',
    os: visitorDto.os || '',
    device: visitorDto.device || '',
    deviceId: visitorDto.deviceId || '',
    hmac: visitorDto.hmac || '',
  });
}

export async function getUserInfo() {
  const userInfo = await prismaService.userInfo.findUnique({
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
  });

  return {
    name: userInfo?.name || '',
    occupation: userInfo?.occupation || '',
    abstract: userInfo?.abstract || '',
    aboutMe: userInfo?.aboutMe || '',
    avatar: ossService.getPrivateUrl(userInfo?.avatar || ''),
    contact: safeParse<Record<string, string>>(userInfo?.contact, {}),
  };
}

export const blogService = {
  getArticleList,
  getArticleDetail,
  getGalleryList,
  getGalleryDetail,
  recordVisitor,
  getUserInfo,
};
