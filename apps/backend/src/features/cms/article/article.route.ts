import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { appRuntime } from '@backend/common/effect';
import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import {
  CreateArticleDtoSchema,
  UpdateArticleDtoSchema,
} from './article.schema';
import { articleService } from './article.service';

const articleRoutes = new Hono().basePath('/articles');

// GET / - 获取所有文章（分页）
articleRoutes.get('/', zValidator('query', PaginateQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = await appRuntime.runPromise(
      articleService.findAll(query.page, query.pageSize),
    );

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      }),
    );
  } catch (error) {
    logger.error('获取文章列表失败', error);
    throw error;
  }
});

// GET /detail - 根据ID获取文章
articleRoutes.get(
  '/detail',
  zValidator('query', z.object({ id: z.string() })),
  async (c) => {
    try {
      const { id } = c.req.valid('query');
      const article = await appRuntime.runPromise(articleService.findById(id));

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
          message: '成功',
          data: article,
        }),
      );
    } catch (error) {
      logger.error('获取文章详情失败', error);
      throw error;
    }
  },
);

// POST /create - 创建文章
articleRoutes.post(
  '/create',
  zValidator('json', CreateArticleDtoSchema),
  async (c) => {
    try {
      const dto = c.req.valid('json');
      const article = await appRuntime.runPromise(articleService.create(dto));

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: article,
        }),
      );
    } catch (error) {
      logger.error('创建文章失败', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '创建失败',
        }),
      );
    }
  },
);

// POST /update - 更新文章
articleRoutes.post(
  '/update',
  zValidator('json', UpdateArticleDtoSchema),
  async (c) => {
    try {
      const dto = c.req.valid('json');
      const result = await appRuntime.runPromise(articleService.update(dto));

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('更新文章失败', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '更新失败',
        }),
      );
    }
  },
);

// POST /delete - 删除文章
articleRoutes.post(
  '/delete',
  zValidator('json', z.object({ id: z.string() })),
  async (c) => {
    try {
      const { id } = c.req.valid('json');
      const deleted = await appRuntime.runPromise(articleService.delete(id));

      if (!deleted) {
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
          message: '成功',
        }),
      );
    } catch (error) {
      logger.error('删除文章失败', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '删除失败',
        }),
      );
    }
  },
);

// POST /upload-images - 上传文章图片
articleRoutes.post(
  '/upload-images',
  zValidator('json', z.object({ images: z.array(z.string()).default([]) })),
  async (c) => {
    try {
      const { images } = c.req.valid('json');
      const urls = await appRuntime.runPromise(
        articleService.getUploadUrls(images),
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: urls,
        }),
      );
    } catch (error) {
      logger.error('上传文章图片失败', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '上传失败',
        }),
      );
    }
  },
);

export default articleRoutes;
