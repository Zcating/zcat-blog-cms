import { Injectable } from '@nestjs/common';

import { PrismaService } from '@backend/common';
import { PaginateQueryDto } from '@backend/model';
import { createPaginate, safeNumber } from '@backend/utils';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly ORDER_MAP = {
    latest: 'desc',
    oldest: 'asc',
  } as const;

  async getArticleList(query: PaginateQueryDto) {
    const articles = await this.prisma.article.findMany({
      ...createPaginate(query.page, query.pageSize),
      orderBy: {
        createdAt: this.ORDER_MAP[query.order],
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

    const total = await this.prisma.article.count();

    return {
      data: articles,
      totalPages: Math.ceil(total / query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getArticleDetail(id: string) {
    const safeId = safeNumber(id);
    if (!safeId) {
      return null;
    }

    const article = await this.prisma.article.findUnique({
      where: { id: safeId },
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

    return article;
  }
}
