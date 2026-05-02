import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { StatisticService } from '@backend/common';
import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { safeNumber, safeParse, createPaginate } from '@backend/utils';

import { prismaService, ossService } from '../../../services';

const blogRoutes = new Hono().basePath('/api/blog');

const statisticService = new StatisticService(prismaService);

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

// GET /article/list - 获取文章列表
blogRoutes.get(
  '/article/list',
  zValidator('query', PaginateQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');

      console.log('获取文章列表, query:', query);

      const articles = await prismaService.article.findMany({
        ...createPaginate(query.page, query.pageSize),
        orderBy: {
          publishAt: ORDER_MAP[query.order],
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          createdAt: true,
          updatedAt: true,
          publishAt: true,
          articleAndArticleTags: true,
        },
      });

      const total = await prismaService.article.count();

      const data = {
        data: articles,
        totalPages: Math.ceil(total / query.pageSize),
        page: query.page,
        pageSize: query.pageSize,
      };

      console.log('获取文章列表成功, data:', data);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data,
        }),
      );
    } catch (error) {
      console.error('获取文章列表失败', error);
      throw error;
    }
  },
);

// GET /article/:id - 获取文章详情
blogRoutes.get('/article/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const safeId = safeNumber(id);

    if (!safeId) {
      return c.json(
        createResult({
          code: ResultCode.DatabaseError,
          message: '文章不存在',
        }),
      );
    }

    const article = await prismaService.article.findUnique({
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

    if (!article) {
      return c.json(
        createResult({
          code: ResultCode.DatabaseError,
          message: '文章不存在',
        }),
      );
    }

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: article,
      }),
    );
  } catch (error) {
    console.error('获取文章详情失败', error);
    throw error;
  }
});

// GET /gallery - 获取相册列表
blogRoutes.get(
  '/gallery',
  zValidator('query', PaginateQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');

      console.log('获取相册列表, query:', query);

      const albumModels = await prismaService.photoAlbum.findMany({
        ...createPaginate(query.page, query.pageSize),
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

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: {
            data: galleries,
            total: galleries.length,
            page: query.page,
            pageSize: query.pageSize,
          },
        }),
      );
    } catch (error) {
      console.error('获取相册列表失败', error);
      throw error;
    }
  },
);

// GET /gallery/:id - 获取相册详情
blogRoutes.get('/gallery/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const albumId = safeNumber(id);

    console.log('获取相册详情, id:', id);

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
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: null,
        }),
      );
    }

    const photos = await photoFindMany({
      where: {
        albumId: albumId,
      },
    });

    const result = {
      id: album.id,
      name: album.name,
      cover: photos.find((photo) => photo.id === album.coverId) || null,
      description: album.description,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt,
      photos: photos.sort((a) => (a.id === album.coverId ? -1 : 1)),
    };

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: result,
      }),
    );
  } catch (error) {
    console.error('获取相册详情失败', error);
    throw error;
  }
});

// POST /visitor - 记录博客访客
blogRoutes.post(
  '/visitor',
  zValidator(
    'json',
    z.object({
      pagePath: z.string(),
      pageTitle: z.string().optional().default(''),
      referrer: z.string().optional().default(''),
      browser: z.string().optional().default(''),
      os: z.string().optional().default(''),
      device: z.string().optional().default(''),
      deviceId: z.string().optional().default(''),
      hmac: z.string().optional().default(''),
    }),
  ),
  async (c) => {
    try {
      const visitorDto = c.req.valid('json');

      console.log('记录博客访客:', visitorDto.pagePath);

      // Create a minimal request-like object compatible with StatisticService.recordVisitor
      const request = {
        headers: {
          'data-hash': c.req.header('data-hash') || '',
          'x-forwarded-for': c.req.header('x-forwarded-for') || '',
        },
        ip:
          c.req.header('x-forwarded-for') ||
          c.req.header('x-real-ip') ||
          'unknown',
        get: (name: string) => c.req.header(name) || '',
      } as any;

      await statisticService.recordVisitor(request, visitorDto);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
        }),
      );
    } catch (error) {
      console.error('记录博客访客失败:', error);
      // 访客记录失败不应该影响用户体验，返回成功
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
        }),
      );
    }
  },
);

// GET /user-info - 获取用户信息
blogRoutes.get('/user-info', async (c) => {
  try {
    console.log('获取用户信息');

    const userInfo = await prismaService.userInfo.findUnique({
      where: {
        id: 1,
      },
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

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: {
          name: userInfo?.name || '',
          occupation: userInfo?.occupation || '',
          abstract: userInfo?.abstract || '',
          aboutMe: userInfo?.aboutMe || '',
          avatar: ossService.getPrivateUrl(userInfo?.avatar || ''),
          contact: safeParse<Record<string, string>>(userInfo?.contact, {}),
        },
      }),
    );
  } catch (error) {
    console.error('获取用户信息失败', error);
    throw error;
  }
});

export default blogRoutes;
