import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createResult, ResultCode } from '@backend/model';
import { isNumber } from '@backend/utils';

import { prismaService, ossService } from '../../../services';
import {
  CreateAlbumPhotoDtoSchema,
  UpdateAlbumPhotoDtoSchema,
} from '../photo-album/photo-album.schema';

import {
  CreatePhotoDtoSchema,
  GetPhotosDtoSchema,
  UpdatePhotoDtoSchema,
} from './photo.schema';

const photoRoutes = new Hono().basePath('/api/cms/photos');

type PhotoWithUrls = {
  url: string;
  thumbnailUrl: string;
};

function transformPhoto<T extends PhotoWithUrls>(
  photo: T,
): Omit<T, 'url' | 'thumbnailUrl'> & PhotoWithUrls {
  return {
    ...photo,
    url: ossService.getPrivateUrl(photo.url),
    thumbnailUrl: ossService.getPrivateUrl(photo.thumbnailUrl),
  };
}

// GET / - 获取所有照片（分页）
photoRoutes.get('/', zValidator('query', GetPhotosDtoSchema), async (c) => {
  try {
    const query = c.req.valid('query');
    const { albumId, page, pageSize } = query;

    console.log('开始获取所有照片');

    if (isNumber(albumId) && albumId <= 0) {
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: {
            data: [],
            page,
            pageSize,
            totalPages: 0,
            total: 0,
          },
        }),
      );
    }

    const where = {
      albumId: albumId,
    };

    const [photos, total] = await Promise.all([
      prismaService.photo.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prismaService.photo.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const result = {
      data: photos.map((photo) => transformPhoto(photo)),
      page,
      pageSize,
      totalPages,
      total,
    };

    console.log(`成功获取 ${result.total} 张照片`);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      }),
    );
  } catch (error) {
    console.error('获取照片列表失败', error);
    throw error;
  }
});

// GET /empty-album - 获取所有未所属相册的照片
photoRoutes.get('/empty-album', async (c) => {
  try {
    console.log('开始获取所有照片');

    const photos = await prismaService.photo.findMany({
      where: {
        albumId: null,
      },
    });

    const result = photos.map((photo) => transformPhoto(photo));

    console.log(`成功获取 ${result.length} 张照片`);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: result,
      }),
    );
  } catch (error) {
    console.error('获取照片列表失败', error);
    throw error;
  }
});

// GET /detail - 根据ID获取照片
photoRoutes.get(
  '/detail',
  zValidator('query', z.object({ id: z.coerce.number().int().positive() })),
  async (c) => {
    const { id } = c.req.valid('query');
    try {
      console.log(`开始获取ID为 ${id} 的照片`);

      const photo = await prismaService.photo.findUnique({
        where: { id },
      });

      if (!photo) {
        console.warn(`未找到ID为 ${id} 的照片`);
        return c.json(
          createResult({
            code: ResultCode.Success,
            message: '成功',
            data: null,
          }),
        );
      }

      console.log(`成功获取ID为 ${id} 的照片`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: transformPhoto(photo),
        }),
      );
    } catch (error) {
      console.error(`获取ID为 ${id} 的照片失败`, error);
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

      console.log(`开始创建照片: ${body.name || '未提供名称'}`);

      const photo = await prismaService.photo.create({
        data: {
          name: body.name,
          url: body.url || '',
          thumbnailUrl: body.thumbnailUrl || '',
          albumId: body.albumId,
        },
      });

      console.log(`成功创建照片，ID: ${photo.id}, 名称: ${photo.name}`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '照片创建成功',
          data: transformPhoto(photo),
        }),
      );
    } catch (error) {
      console.error('创建照片失败', error);
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

      console.log(`开始创建相册照片: ${body.name || '未提供名称'}`);

      const photo = await prismaService.photo.create({
        data: {
          name: body.name,
          url: body.url || '',
          thumbnailUrl: body.thumbnailUrl || '',
          albumId: body.albumId,
        },
      });

      console.log(`成功创建相册照片，ID: ${photo.id}, 名称: ${photo.name}`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '照片创建成功',
          data: transformPhoto(photo),
        }),
      );
    } catch (error) {
      console.error('创建相册照片失败', error);
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

      console.log(
        `开始更新照片ID: ${body.id}, 名称: ${body.name || '未提供名称'}`,
      );

      const photo = await prismaService.photo.update({
        where: { id: body.id },
        data: {
          name: body.name,
          url: body.url,
          thumbnailUrl: body.thumbnailUrl,
          albumId: body.albumId,
        },
      });

      console.log(`成功更新照片，ID: ${photo.id}, 名称: ${photo.name}`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: transformPhoto(photo),
        }),
      );
    } catch (error) {
      console.error('更新照片失败', error);
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

      console.log(`开始更新相册照片ID: ${body.id}, 相册ID: ${body.albumId}`);

      // 先更新相册封面
      if (body.isCover) {
        await prismaService.photoAlbum.update({
          where: { id: body.albumId },
          data: {
            coverId: body.id,
          },
        });
      }

      // 再更新照片
      const updatedPhoto = await prismaService.photo.update({
        where: { id: body.id },
        data: {
          name: body.name,
          url: body.url,
          thumbnailUrl: body.thumbnailUrl,
          albumId: body.albumId,
        },
      });

      const result = {
        ...transformPhoto(updatedPhoto),
        albumId: body.albumId,
        isCover: body.isCover,
      };

      if (!result) {
        console.warn(`更新相册照片失败：未找到ID为 ${body.id} 的照片`);
        return c.json(
          createResult({
            code: ResultCode.DatabaseError,
            message: '更新失败',
          }),
        );
      }

      console.log(
        `成功更新相册照片，照片ID: ${result.id}, 相册ID: ${result.albumId}`,
      );
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      console.error('更新相册照片失败', error);
      throw error;
    }
  },
);

// POST /delete - 删除照片
photoRoutes.post(
  '/delete',
  zValidator('json', z.object({ id: z.coerce.number().int().positive() })),
  async (c) => {
    const { id } = c.req.valid('json');
    try {
      console.log(`开始删除ID为 ${id} 的照片`);

      const photo = await prismaService.photo.findUnique({
        where: { id },
      });

      if (!photo) {
        console.warn(`未找到ID为 ${id} 的照片`);
        return c.json(
          createResult({
            code: ResultCode.Success,
            message: '成功',
          }),
        );
      }

      // 删除 oss 的数据
      await Promise.allSettled([
        ossService.deleteFile(photo.url),
        ossService.deleteFile(photo.thumbnailUrl),
      ]);

      // 删除数据库记录
      await prismaService.photo.delete({
        where: { id },
      });

      console.log(`成功删除ID为 ${id} 的照片`);
      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      console.error(`删除ID为 ${id} 的照片失败`, error);
      throw error;
    }
  },
);

export default photoRoutes;
