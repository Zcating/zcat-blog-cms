import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import { AddPhotosDtoSchema } from '../photo/photo.schema';

import {
  CreatePhotoAlbumDtoSchema,
  SetCoverDtoSchema,
  UpdateAlbumDtoSchema,
} from './photo-album.schema';
import { photoAlbumService } from './photo-album.service';

const photoAlbumRoutes = new Hono().basePath('/photo-albums');

// GET / - 获取所有相册
photoAlbumRoutes.get(
  '/',
  zValidator('query', PaginateQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');
      const result = await photoAlbumService.findAll(
        query.page,
        query.pageSize,
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('获取相册列表失败', error);
      throw error;
    }
  },
);

// GET /:id - 根据ID获取相册
photoAlbumRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const album = await photoAlbumService.findById(id);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: album,
      }),
    );
  } catch (error) {
    logger.error(`获取相册失败`, error);
    throw error;
  }
});

// POST / - 创建相册
photoAlbumRoutes.post(
  '/',
  zValidator('json', CreatePhotoAlbumDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const album = await photoAlbumService.create(body);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: album,
        }),
      );
    } catch (error) {
      logger.error('创建相册失败', error);
      throw error;
    }
  },
);

// POST /update - 更新相册
photoAlbumRoutes.post(
  '/update',
  zValidator('json', UpdateAlbumDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      if (!body.id) {
        return c.json(
          createResult({
            code: ResultCode.ValidationError,
            message: '更新失败：缺少ID',
          }),
        );
      }
      const result = await photoAlbumService.update(body.id, body);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('更新相册失败', error);
      throw error;
    }
  },
);

// POST /delete - 删除相册
photoAlbumRoutes.post(
  '/delete',
  zValidator('json', z.object({ id: z.string() })),
  async (c) => {
    try {
      const { id } = c.req.valid('json');
      await photoAlbumService.delete(id);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      logger.error('删除相册失败', error);
      throw error;
    }
  },
);

// POST /cover - 设置相册封面
photoAlbumRoutes.post(
  '/cover',
  zValidator('json', SetCoverDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      await photoAlbumService.setCover(body.albumId, body.photoId);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      logger.error('设置相册封面失败', error);
      throw error;
    }
  },
);

// POST /add-photos - 批量添加照片到相册
photoAlbumRoutes.post(
  '/add-photos',
  zValidator('json', AddPhotosDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const success = await photoAlbumService.addPhotos(
        body.albumId,
        body.photoIds,
      );

      if (!success) {
        return c.json(
          createResult({
            code: ResultCode.ValidationError,
            message: '相册不存在',
          }),
        );
      }

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '批量添加照片到相册成功',
        }),
      );
    } catch (error) {
      logger.error('批量添加照片到相册失败', error);
      throw error;
    }
  },
);

export default photoAlbumRoutes;
