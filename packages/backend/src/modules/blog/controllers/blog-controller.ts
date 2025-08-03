import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import {
  createResult,
  PaginateQueryDto,
  PaginateValidationPipe,
} from '@backend/model';
import { Article } from '@backend/table';

import { Repository } from 'typeorm';

@ApiTags('文章对外接口')
@Controller('api/blog')
export class BlogController {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  @ApiOperation({ summary: '获取文章列表' })
  @Get('article/list')
  async getArticles(@Query(PaginateValidationPipe) query: PaginateQueryDto) {
    const articles = await this.articleRepository.find({
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
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
}
