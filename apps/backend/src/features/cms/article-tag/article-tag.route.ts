import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';

import { prismaService } from '../../../services';

import {
  CreateArticleTagDtoSchema,
  UpdateArticleTagDtoSchema,
} from './article-tag.schema';

const articleTagRoutes = new Hono().basePath('/api/cms/article-tags');

// GET / - 获取所有文章标签
articleTagRoutes.get('/', async (c) => {
  try {
    console.log('开始获取所有文章标签');
    const tags = await prismaService.articleTag.findMany();

    console.log(`成功获取 ${tags.length} 个文章标签`);
    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: tags,
      }),
    );
  } catch (error: any) {
    console.error('获取文章标签失败', error);
    throw error;
  }
});

// GET /:id - 根据ID获取文章标签
articleTagRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    console.log(`开始获取ID为 ${id} 的文章标签`);

    const tag = await prismaService.articleTag.findUnique({
      where: { id: parseInt(id, 10) },
    });

    console.log(`${tag ? '成功' : '未找到'}获取ID为 ${id} 的文章标签`);
    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: tag,
      }),
    );
  } catch (error) {
    console.error(`获取ID为 ${id} 的文章标签失败`);
    throw error;
  }
});

// POST / - 创建文章标签
articleTagRoutes.post(
  '/',
  zValidator('json', CreateArticleTagDtoSchema),
  async (c) => {
    try {
      const dto = c.req.valid('json');

      console.log(`开始创建文章标签: ${JSON.stringify(dto)}`);

      const tag = await prismaService.articleTag.create({
        data: dto,
      });

      console.log(`成功创建文章标签，ID: ${tag.id}`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: tag,
        }),
      );
    } catch (error: any) {
      console.error('创建文章标签失败', error);
      return c.json(
        createResult({
          code: ResultCode.UnknownError,
          message: '创建失败',
        }),
      );
    }
  },
);

// PUT /:id - 更新文章标签
articleTagRoutes.put(
  '/:id',
  zValidator('json', UpdateArticleTagDtoSchema),
  async (c) => {
    const id = c.req.param('id');
    try {
      const dto = c.req.valid('json');

      console.log(`开始更新ID为 ${id} 的文章标签: ${JSON.stringify(dto)}`);

      const result = await prismaService.articleTag.update({
        where: { id: parseInt(id, 10) },
        data: dto,
      });

      console.log(`成功更新ID为 ${id} 的文章标签`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      console.error(`更新ID为 ${id} 的文章标签失败：未找到记录`, error);
      return c.json(
        createResult({
          code: ResultCode.DatabaseError,
          message: '更新失败',
        }),
      );
    }
  },
);

// DELETE /:id - 删除文章标签
articleTagRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  try {
    console.log(`开始删除ID为 ${id} 的文章标签`);

    await prismaService.articleTag.delete({
      where: { id: parseInt(id, 10) },
    });

    console.log(`成功删除ID为 ${id} 的文章标签`);
    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
      }),
    );
  } catch (error) {
    console.error(`删除ID为 ${id} 的文章标签失败`, error);
    return c.json(
      createResult({
        code: ResultCode.UnknownError,
        message: '删除失败',
      }),
    );
  }
});

export default articleTagRoutes;
