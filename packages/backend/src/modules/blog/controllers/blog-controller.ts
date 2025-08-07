import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { createResult, PaginateQueryDto } from '@backend/model';
import { Article, PhotoAlbum } from '@backend/table';
import { createPaginate } from '@backend/utils';

import { Repository } from 'typeorm';

@ApiTags('文章对外接口')
@Controller('api/blog')
export class BlogController {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(PhotoAlbum)
    private readonly albumRepository: Repository<PhotoAlbum>,
  ) {}

  @ApiOperation({ summary: '获取文章列表' })
  @Get('article/list')
  async getArticles(@Query() query: PaginateQueryDto) {
    const articles = await this.articleRepository.find({
      ...createPaginate(query.page, query.pageSize),
      select: ['id', 'title', 'excerpt', 'createdAt', 'updatedAt', 'tags'],
    });

    return createResult({
      code: '0000',
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
    const article = await this.articleRepository.findOne({
      where: { id },
      select: [
        'id',
        'title',
        'excerpt',
        'content',
        'createdAt',
        'updatedAt',
        'tags',
      ],
    });

    return createResult({
      code: '0000',
      message: 'success',
      data: article,
    });
  }

  @ApiOperation({ summary: '获取文章图片' })
  @Get('gallery')
  async getGallery(@Query() query: PaginateQueryDto) {
    const albums = await this.albumRepository.find({
      ...createPaginate(query.page, query.pageSize),
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      relations: ['cover'],
    });
    return createResult({
      code: '0000',
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
    const album = await this.albumRepository.findOne({
      where: { id },
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      relations: ['cover', 'photos'],
    });
    return createResult({
      code: '0000',
      message: 'success',
      data: album,
    });
  }
}
