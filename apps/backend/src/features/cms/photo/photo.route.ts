import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createResult, ResultCode } from '@backend/model';
import { logger } from '@backend/utils';

import {
  CreateAlbumPhotoDtoSchema,
  UpdateAlbumPhotoDtoSchema,
} from '../photo-album/photo-album.schema';

import {
  CreatePhotoDtoSchema,
  GetPhotosDtoSchema,
  UpdatePhotoDtoSchema,
} from './photo.schema';
import { photoService } from './photo.service';

const photoRoutes = new Hono().basePath('/api/cms/photos');

// GET / - 获取所有照片（分页）
photoRoutes.get('/', zValidator('query', GetPhotosDtoSchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const result = await photoService.findAll(
      query.albumId,
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
    logger.error('获取照片列表失败', error);
    throw error;
  }
});

// GET /empty-album - 获取所有未所属相册的照片
photoRoutes.get('/empty-album', async (c) => {
  try {
    const result = await photoService.findEmptyAlbum();

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      }),
    );
  } catch (error) {
    logger.error('获取照片列表失败', error);
    throw error;
  }
});

// GET /detail - 根据ID获取照片
photoRoutes.get(
  '/detail',
  zValidator('query', z.object({ id: z.coerce.number().int().positive() })),
  async (c) => {
    try {
      const { id } = c.req.valid('query');
      const photo = await photoService.findById(id);

      if (!photo) {
        return c.json(
          createResult({
            code: ResultCode.Success,
            message: '成功',
            data: null,
          }),
        );
      }

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: photo,
        }),
      );
    } catch (error) {
      logger.error('获取照片详情失败', error);
      throw error;
    }
  },
);

// POST /create - 创建照片
photoRoutes.post(
  '/create',
  zValidator('json', CreatePhotoDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const photo = await photoService.create(body);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '照片创建成功',
          data: photo,
        }),
      );
    } catch (error) {
      logger.error('创建照片失败', error);
      throw error;
    }
  },
);

// POST /create/with-album - 创建相册照片
photoRoutes.post(
  '/create/with-album',
  zValidator('json', CreateAlbumPhotoDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const photo = await photoService.create(body);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '照片创建成功',
          data: photo,
        }),
      );
    } catch (error) {
      logger.error('创建相册照片失败', error);
      throw error;
    }
  },
);

// POST /update - 更新照片
photoRoutes.post(
  '/update',
  zValidator('json', UpdatePhotoDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const photo = await photoService.update(body.id, body);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: photo,
        }),
      );
    } catch (error) {
      logger.error('更新照片失败', error);
      throw error;
    }
  },
);

// POST /update/with-album - 更新相册照片
photoRoutes.post(
  '/update/with-album',
  zValidator('json', UpdateAlbumPhotoDtoSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const result = await photoService.updateWithAlbum(
        body.id,
        body.albumId,
        body,
      );

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      logger.error('更新相册照片失败', error);
      throw error;
    }
  },
);

// POST /delete - 删除照片
photoRoutes.post(
  '/delete',
  zValidator('json', z.object({ id: z.coerce.number().int().positive() })),
  async (c) => {
    try {
      const { id } = c.req.valid('json');
      const deleted = await photoService.delete(id);

      if (!deleted) {
        return c.json(
          createResult({
            code: ResultCode.Success,
            message: '成功',
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
      logger.error('删除照片失败', error);
      throw error;
    }
  },
);

export default photoRoutes;
