import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createResult, PaginateQuerySchema, ResultCode } from '@backend/model';
import { createPaginate } from '@backend/utils';

import { prismaService, ossService } from '../../../services';
import { AddPhotosDtoSchema } from '../photo/photo.schema';

import {
  CreatePhotoAlbumDtoSchema,
  SetCoverDtoSchema,
  UpdateAlbumDtoSchema,
} from './photo-album.schema';

const photoAlbumRoutes = new Hono().basePath('/api/cms/photo-albums');

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

// GET / - 获取所有相册
photoAlbumRoutes.get(
  '/',
  zValidator('query', PaginateQuerySchema),
  async (c) => {
    try {
      const query = c.req.valid('query');

      console.log('开始获取所有相册');

      const [albums, total] = await Promise.all([
        prismaService.photoAlbum.findMany({
          orderBy: { createdAt: 'desc' },
          ...createPaginate(query.page, query.pageSize),
        }),
        prismaService.photoAlbum.count(),
      ]);

      const coverIds = albums
        .map((album) => album.coverId)
        .filter((id): id is number => id !== null);

      const covers =
        coverIds.length > 0
          ? await prismaService.photo.findMany({
              where: { id: { in: coverIds } },
            })
          : [];

      const data = albums.map((album) => {
        const foundedCover = covers.find((cover) => cover.id === album.coverId);
        const cover = foundedCover ? transformPhoto(foundedCover) : null;
        return {
          id: album.id,
          name: album.name,
          description: album.description,
          coverId: album.coverId,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
          available: album.available,
          cover,
        };
      });

      const pagination = {
        data,
        totalPages: Math.ceil(total / query.pageSize),
        page: query.page,
        pageSize: query.pageSize,
        total,
      };

      console.log(`成功获取 ${pagination.data.length} 个相册`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: pagination,
        }),
      );
    } catch (error) {
      console.error('获取相册列表失败', error);
      throw error;
    }
  },
);

// GET /:id - 根据ID获取相册
photoAlbumRoutes.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    console.log(`开始获取ID为 ${id} 的相册`);

    const album = await prismaService.photoAlbum.findUnique({
      where: { id: parseInt(id, 10) },
    });

    console.log(`成功获取ID为 ${id} 的相册`);

    return c.json(
      createResult({
        code: ResultCode.Success,
        message: '成功',
        data: album,
      }),
    );
  } catch (error) {
    console.error(`获取ID为 ${c.req.param('id')} 的相册失败`, error);
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

      console.log(`开始创建相册: ${body.name}`);

      const album = await prismaService.photoAlbum.create({
        data: body,
      });

      console.log(`成功创建相册，ID: ${album.id}, 名称: ${album.name}`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: album,
        }),
      );
    } catch (error) {
      console.error('创建相册失败', error);
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

      console.log(`开始更新相册ID: ${body.id}`);

      const result = await prismaService.photoAlbum.update({
        where: { id: body.id },
        data: body,
      });

      console.log(`成功更新相册，ID: ${result.id}`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
          data: result,
        }),
      );
    } catch (error) {
      console.error(`更新相册失败`, error);
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

      console.log(`开始删除ID为 ${id} 的相册`);

      await prismaService.photoAlbum.delete({
        where: { id: parseInt(id, 10) },
      });

      console.log(`成功删除ID为 ${id} 的相册`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      console.error(`删除相册失败`, error);
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

      console.log(
        `开始设置相册封面: 相册ID ${body.albumId}, 照片ID ${body.photoId}`,
      );

      await prismaService.photoAlbum.update({
        where: { id: body.albumId },
        data: {
          coverId: body.photoId,
        },
      });

      console.log(`成功设置相册封面`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '成功',
        }),
      );
    } catch (error) {
      console.error('设置相册封面失败', error);
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

      console.log(
        `开始批量添加照片到相册: 相册ID ${body.albumId}, 照片IDs: ${body.photoIds.join(', ')}`,
      );

      const album = await prismaService.photoAlbum.findUnique({
        where: { id: body.albumId },
      });

      if (!album) {
        return c.json(
          createResult({
            code: ResultCode.ValidationError,
            message: '相册不存在',
          }),
        );
      }

      await prismaService.photo.updateMany({
        where: {
          id: {
            in: body.photoIds,
          },
        },
        data: {
          albumId: body.albumId,
        },
      });

      console.log(`成功批量添加照片到相册`);

      return c.json(
        createResult({
          code: ResultCode.Success,
          message: '批量添加照片到相册成功',
        }),
      );
    } catch (error) {
      console.error('批量添加照片到相册失败', error);
      throw error;
    }
  },
);

export default photoAlbumRoutes;
