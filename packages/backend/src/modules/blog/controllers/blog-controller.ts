import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Req,
  Headers,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { OssService, PrismaService } from '@backend/core';
import {
  createResult,
  PaginateQueryDto,
  ResultCode,
  ResultData,
} from '@backend/model';
import { Prisma } from '@backend/prisma';
import { createPaginate } from '@backend/utils';

import { Request } from 'express';
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

import { hashTest } from '@backend/utils/hash';

// 博客访客记录DTO
interface BlogVisitorDto {
  pagePath: string;
  pageTitle: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
  deviceId: string;
  hmac: string;
}

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
          this.photoFindMany({
            where: {
              albumId: {
                in: albumModels.map((item) => item.id),
              },
            },
          }),
        );
      }),
      map(([albumModels, photos]) => {
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
          this.photoFindMany({
            where: {
              albumId: id,
            },
          }),
        ),
      ),
      map(([album, photos]) => {
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

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: album,
    });
  }

  @ApiOperation({ summary: '记录博客访客' })
  @ApiResponse({ status: 200, description: '访客记录成功' })
  @Post('visitor')
  async recordVisitor(
    @Body() visitorDto: BlogVisitorDto,
    @Req() request: Request,
    @Headers('Data-Hash') hash: string,
  ): Promise<ResultData<void>> {
    try {
      const result = hashTest(visitorDto, hash);
      if (!result) {
        return createResult({
          code: ResultCode.Success,
          message: 'success',
        });
      }

      // 获取客户端IP
      const clientIp =
        request.ip ||
        (request.headers['x-forwarded-for'] as string) ||
        'unknown';

      // 获取referrer信息
      const referrer = visitorDto.referrer || request.get('Referer') || '';

      // 创建统计记录，直接使用前端传递的设备信息
      // 异步入库

      await this.prisma.statistic.create({
        data: {
          pagePath: visitorDto.pagePath,
          pageTitle: visitorDto.pageTitle,
          browser: visitorDto.browser || 'Unknown',
          os: visitorDto.os || 'Unknown',
          device: visitorDto.device || 'Unknown',
          deviceId: visitorDto.deviceId,
          ip: clientIp,
          referrer,
        },
      });

      return createResult({
        code: ResultCode.Success,
        message: 'success',
      });
    } catch (error) {
      console.error('记录博客访客失败:', error);
      // 访客记录失败不应该影响用户体验，返回成功
      return createResult({
        code: ResultCode.Success,
        message: 'success',
      });
    }
  }

  private photoFindMany = async (
    ...args: Parameters<Prisma.PhotoDelegate['findMany']>
  ) => {
    const photos = await this.prisma.photo.findMany(...args);
    return photos.map((photo) => ({
      ...photo,
      url: this.ossService.getPrivateUrl(photo.url),
      thumbnailUrl: this.ossService.getPrivateUrl(photo.thumbnailUrl),
    }));
  };
}
