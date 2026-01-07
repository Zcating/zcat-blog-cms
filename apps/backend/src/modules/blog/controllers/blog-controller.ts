import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Body,
  Req,
  Logger,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

import { OssService, PrismaService, StatisticService } from '@backend/common';
import {
  createResult,
  PaginateQueryDto,
  ResultCode,
  ResultData,
} from '@backend/model';
import { Prisma } from '@backend/prisma';
import { createPaginate, safeParse } from '@backend/utils';

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

import { BlogService } from '../services/blog.service';

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
  private readonly logger = new Logger(BlogController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ossService: OssService,
    private readonly statisticService: StatisticService,
    private readonly blogService: BlogService,
  ) {}

  @ApiOperation({ summary: '获取文章列表' })
  @Get('article/list')
  async getArticles(@Query() query: PaginateQueryDto) {
    this.logger.log('获取文章列表, query:', query);

    const data = await this.blogService.getArticleList(query);

    this.logger.log('获取文章列表成功, data:', data);

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: data,
    });
  }

  @ApiOperation({ summary: '获取文章详情' })
  @Get('article/:id')
  async getArticleDetail(@Param('id') id: string) {
    const article = await this.blogService.getArticleDetail(id);
    if (!article) {
      return createResult({
        code: ResultCode.DatabaseError,
        message: '文章不存在',
      });
    }
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
  ): Promise<ResultData<void>> {
    try {
      await this.statisticService.recordVisitor(request, visitorDto);

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

  @ApiOperation({ summary: '获取用户信息' })
  @Get('user-info')
  async getUserInfo() {
    const userInfo = await this.prisma.userInfo.findUnique({
      where: {
        id: 1,
      },
      select: {
        name: true,
        occupation: true,
        abstract: true,
        aboutMe: true,
        contact: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return createResult({
      code: ResultCode.Success,
      message: 'success',
      data: {
        name: userInfo?.name || '',
        occupation: userInfo?.occupation || '',
        abstract: userInfo?.abstract || '',
        aboutMe: userInfo?.aboutMe || '',
        avatar: this.ossService.getPrivateUrl(userInfo?.avatar || ''),
        contact: safeParse<Record<string, string>>(userInfo?.contact, {}),
      },
    });
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
