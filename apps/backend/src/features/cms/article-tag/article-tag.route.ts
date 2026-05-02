import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { createResult, ResultCode } from '@backend/model';

import {
  CreateArticleTagDtoSchema,
  UpdateArticleTagDtoSchema,
} from './article-tag.schema';
import { articleTagService } from './article-tag.service';

const articleTagRoutes = new Hono().basePath('/api/cms/article-tags');

// GET / - 获取所有文章标签
articleTagRoutes.get('/', async (c) => {
  try {
    const tags = await articleTagService.findAll();

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
    const tag = await articleTagService.findById(id);

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
      const tag = await articleTagService.create(dto);

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
      const result = await articleTagService.update(id, dto);

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
    await articleTagService.delete(id);

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
