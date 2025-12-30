import { Injectable } from '@nestjs/common';

import { PrismaService } from '@backend/common';
import { PaginateQueryDto } from '@backend/model';
import { createPaginate } from '@backend/utils';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly SORT_MAP = {
    latest: 'desc',
    oldest: 'asc',
  } as const;

  async getArticleList(query: PaginateQueryDto) {
    const articles = await this.prisma.article.findMany({
      ...createPaginate(query.page, query.pageSize),
      orderBy: {
        createdAt: this.SORT_MAP[query.sort],
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
      articles,
      totalPages: Math.ceil(total / query.pageSize),
      page: query.page,
      pageSize: query.pageSize,
    };
  }
}
