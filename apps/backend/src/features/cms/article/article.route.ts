import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { createPaginate, safeNumber } from '@backend/utils';

import { prismaService, ossService } from '../../../services';

import {
  CreateArticleDtoSchema,
  UpdateArticleDtoSchema,
} from './article.schema';

const articleRoutes = new Hono().basePath('/api/cms/articles');

// GET / - 获取所有文章（分页）
articleRoutes.get('/', zValidator('query', PaginateQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');

    console.log('开始获取所有文章');

    const result = await prismaService.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      ...createPaginate(query.page, query.pageSize),
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        createByUserId: true,
        publishAt: true,
      },
    });
    const total = await prismaService.article.count();

    const pagination = {
      data: result.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        publishAt: article.publishAt,
      })),
      totalPages: Math.ceil(total / query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };

    console.log(`成功获取 ${pagination.data.length} 篇文章`);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: pagination,
      }),
    );
  } catch (error) {
    console.error('获取文章列表失败', error);
    throw error;
  }
});

// GET /detail - 根据ID获取文章
articleRoutes.get(
  '/detail',
  zValidator('query', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('query');
    try {
      console.log(`开始获取ID为 ${id} 的文章`);

      const safeId = safeNumber(id, 0);
      if (!safeId) {
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '未找到文章',
          }),
        );
      }

      const article = await prismaService.article.findUnique({
        where: { id: safeId },
      });

      if (!article) {
        console.warn(`未找到ID为 ${id} 的文章`);
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '未找到文章',
          }),
        );
      }

      console.log(`成功获取ID为 ${id} 的文章`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: article,
        }),
      );
    } catch (error) {
      console.error(`获取ID为 ${id} 的文章失败`, error);
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

      console.log(`开始创建文章: ${dto.title}`);

      const article = await prismaService.article.create({
        data: dto,
      });

      console.log(`成功创建文章，ID: ${article.id}, 标题: ${article.title}`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: article,
        }),
      );
    } catch (error) {
      console.error('创建文章失败', error);
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
    const dto = c.req.valid('json');
    try {
      console.log(
        `开始更新ID为 ${dto.id} 的文章: ${dto.title || '未提供标题'}`,
      );

      const result = await prismaService.article.update({
        where: { id: dto.id },
        data: dto,
      });

      if (!result) {
        console.warn(`更新ID为 ${dto.id} 的文章失败：未找到记录`);
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '更新失败',
          }),
        );
      }

      console.log(`成功更新ID为 ${dto.id} 的文章`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      console.error(`更新ID为 ${dto.id} 的文章失败`, error);
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
    const { id } = c.req.valid('json');
    try {
      console.log(`开始删除ID为 ${id} 的文章`);

      const safeId = safeNumber(id, 0);
      if (!safeId) {
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '删除失败',
          }),
        );
      }

      const result = await prismaService.article.delete({
        where: { id: safeId },
      });

      // NOTE: Replicating original behavior — `!result` is always false when delete succeeds
      // (result is the deleted record, which is truthy)
      if (!result) {
        console.warn(`删除ID为 ${id} 的文章失败：未找到记录`);
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '删除失败',
          }),
        );
      }

      console.log(`成功删除ID为 ${id} 的文章`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      console.error(`删除ID为 ${id} 的文章失败`, error);
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

      console.log(`开始上传 ${images.length} 张文章图片`);

      const urls = images.map((image) => ossService.getArticleUrl(image));

      console.log(`成功上传 ${urls.length} 张文章图片`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: urls,
        }),
      );
    } catch (error) {
      console.error('上传文章图片失败', error);
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
