import { Injectable } from '@nestjs/common';

import { PrismaService } from '@backend/common';
import { PaginateQueryDto, PaginateResult } from '@backend/model';
import { createPaginate } from '@backend/utils';

import { ReturnArticleDto } from '../dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  async findArticles(
    dto: PaginateQueryDto,
  ): Promise<PaginateResult<ReturnArticleDto>> {
    const result = await this.prismaService.article.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      ...createPaginate(dto.page, dto.pageSize),
      select: {
        id: true,
        title: true,
        excerpt: true,
        createdAt: true,
        updatedAt: true,
        createByUserId: true,
      },
    });
    const total = await this.prismaService.article.count();
    return {
      data: result.map((article) => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        // tags: article.articleAndArticleTags.map((item) => item.articleTag),
      })),
      totalPages: Math.ceil(total / dto.pageSize),
      page: dto.page,
      pageSize: dto.pageSize,
    };
  }
}
