import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '@backend/core';
import { createResult, PaginateQueryDto, ResultCode } from '@backend/model';
import { createPaginate } from '@backend/utils';

@ApiTags('文章对外接口')
@Controller('api/blog')
export class BlogController {
  constructor(private readonly prisma: PrismaService) {}

  @ApiOperation({ summary: '获取文章列表' })
  @Get('article/list')
  async getArticles(@Query() query: PaginateQueryDto) {
    const articles = await this.prisma.article.findMany({
      ...createPaginate(query.page, query.pageSize),
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        articleAndArticleTags: true,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        data: articles,
        total: articles.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  }

  @ApiOperation({ summary: '获取文章详情' })
  @Get('article/:id')
  async getArticleDetail(@Param('id') id: number) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        excerpt: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        articleAndArticleTags: true,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: article,
    });
  }

  @ApiOperation({ summary: '获取文章图片' })
  @Get('gallery')
  async getGallery(@Query() query: PaginateQueryDto) {
    const albumModels = await this.prisma.photoAlbum.findMany({
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

    const photos = await this.prisma.photo.findMany({
      where: {
        albumId: {
          in: albumModels.map((item) => item.id),
        },
      },
    });

    const albums = albumModels.map((item) => ({
      id: item.id,
      name: item.name,
      cover: photos.find((photo) => photo.id === item.coverId),
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        data: albums,
        total: albums.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  }

  @ApiOperation({ summary: '获取图片详情' })
  @Get('gallery/:id')
  async getGalleryDetail(@Param('id') id: number) {
    const album = await this.prisma.photoAlbum.findUnique({
      where: { id },
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
      return createResult({
        code: ResultCode.Success,
        message: 'success',
        data: null,
      });
    }

    const photos = await this.prisma.photo.findMany({
      where: {
        albumId: id,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        id: album.id,
        name: album.name,
        description: album.description,
        createdAt: album.createdAt,
        updatedAt: album.updatedAt,
        cover: photos.find((photo) => photo.id === album.coverId),
        photos,
      },
    });
  }
}
