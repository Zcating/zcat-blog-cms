import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { OssService, PrismaService } from '@backend/core';
import { createResult, PaginateQueryDto, ResultCode } from '@backend/model';
import { createPaginate } from '@backend/utils';

import {
  defer,
  from,
  lastValueFrom,
  map,
  of,
  switchMap,
  takeWhile,
  tap,
  zip,
  zipWith,
} from 'rxjs';

@ApiTags('文章对外接口')
@Controller('api/blog')
export class BlogController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ossService: OssService,
  ) {}

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

  @ApiOperation({ summary: '获取相册列表' })
  @Get('gallery')
  async getGallery(@Query() query: PaginateQueryDto) {
    const result$ = from(
      this.prisma.photoAlbum.findMany({
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
      }),
    ).pipe(
      switchMap((albumModels) => {
        return zip(
          of(albumModels),
          this.prisma.photo.findMany({
            where: {
              albumId: {
                in: albumModels.map((item) => item.id),
              },
            },
          }),
        );
      }),
      map(([albumModels, photos]) => {
        photos.forEach((photo) => {
          photo.url = this.ossService.getPrivateUrl(photo.url);
          photo.thumbnailUrl = this.ossService.getPrivateUrl(
            photo.thumbnailUrl,
          );
        });

        return albumModels.map((item) => ({
          id: item.id,
          name: item.name,
          cover: photos.find((photo) => photo.id === item.coverId),
          description: item.description,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));
      }),
    );

    const galleries = await lastValueFrom(result$).catch(() => []);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        data: galleries,
        total: galleries.length,
        page: query.page,
        pageSize: query.pageSize,
      },
    });
  }

  @ApiOperation({ summary: '获取图片详情' })
  @Get('gallery/:id')
  async getGalleryDetail(@Param('id') id: number) {
    const result$ = from(
      this.prisma.photoAlbum.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          coverId: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ).pipe(
      tap((album) => {
        if (!album) {
          throw new Error('album not found');
        }
      }),
      takeWhile(Boolean),
      zipWith(
        defer(() =>
          this.prisma.photo.findMany({
            where: {
              albumId: id,
            },
          }),
        ),
      ),
      map(([album, photos]) => {
        photos.forEach((photo) => {
          photo.url = this.ossService.getPrivateUrl(photo.url);
          photo.thumbnailUrl = this.ossService.getPrivateUrl(
            photo.thumbnailUrl,
          );
        });

        return {
          id: album.id,
          name: album.name,
          cover: photos.find((photo) => photo.id === album.coverId),
          description: album.description,
          createdAt: album.createdAt,
          updatedAt: album.updatedAt,
          photos: photos.sort((a) => {
            return a.id === album.coverId ? -1 : 1;
          }),
        };
      }),
    );
    const album = await lastValueFrom(result$).catch(() => null);
    console.log(album);
    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: album,
    });
  }
}
