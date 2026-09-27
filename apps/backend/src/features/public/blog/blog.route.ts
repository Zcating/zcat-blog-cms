import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { recordVisitor } from '@backend/common';
import { appRuntime } from '@backend/common/effect';
import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { blogService } from './blog.service';

const blogRoutes = new Hono();

// GET /article/list - 获取文章列表
blogRoutes.get(
  '/article/list',
  zValidator('query', PaginateQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');

      logger.info({ query }, '获取文章列表, query:');

      const result = await appRuntime.runPromise(
        blogService.getArticleList(
          query.page,
          query.pageSize,
          query.order as 'latest' | 'oldest' | undefined,
        ),
      );

      logger.info({ result }, '获取文章列表成功, data:');

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('获取文章列表失败', error);
      throw error;
    }
  },
);

// GET /article/:id - 获取文章详情
blogRoutes.get('/article/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const article = await appRuntime.runPromise(
      blogService.getArticleDetail(id),
    );

    if (!article) {
      return c.json(
        createResult({
          code: ResultCode.ResourceNotFound,
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
    logger.error('获取文章详情失败', error);
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

      logger.info({ query }, '获取相册列表, query:');

      const result = await appRuntime.runPromise(
        blogService.getGalleryList(query.page, query.pageSize),
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('获取相册列表失败', error);
      throw error;
    }
  },
);

// GET /gallery/:id - 获取相册详情
blogRoutes.get('/gallery/:id', async (c) => {
  try {
    const id = c.req.param('id');

    logger.info({ id }, '获取相册详情, id:');

    const result = await appRuntime.runPromise(
      blogService.getGalleryDetail(id),
    );

    if (!result) {
      return c.json(
        createResult({
          code: ResultCode.ResourceNotFound,
          message: '相册不存在',
        }),
      );
    }

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: result,
      }),
    );
  } catch (error) {
    logger.error('获取相册详情失败', error);
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
    }),
  ),
  async (c) => {
    try {
      const visitorDto = c.req.valid('json');

      logger.info({ pagePath: visitorDto.pagePath }, '记录博客访客:');

      const ip =
        c.req.header('x-forwarded-for') ||
        c.req.header('x-real-ip') ||
        'unknown';

      await appRuntime.runPromise(
        blogService.recordVisitor(
          visitorDto,
          {
            'data-hash': c.req.header('data-hash') || '',
            'x-forwarded-for': c.req.header('x-forwarded-for') || '',
          },
          ip,
        ),
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: 'success',
        }),
      );
    } catch (error) {
      logger.error('记录博客访客失败:', error);
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
    logger.info('获取用户信息');

    const userInfo = await appRuntime.runPromise(blogService.getUserInfo());

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: 'success',
        data: userInfo,
      }),
    );
  } catch (error) {
    logger.error('获取用户信息失败', error);
    throw error;
  }
});

export default blogRoutes;
