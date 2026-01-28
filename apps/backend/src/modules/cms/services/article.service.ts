import { Injectable } from '@nestjs/common';

import { OssService, PrismaService } from '@backend/common';
import { PaginateQueryDto, PaginateResult } from '@backend/model';
import { Article } from '@backend/prisma';
import { createPaginate, safeNumber } from '@backend/utils';

import {
  CreateArticleDto,
  ReturnArticleDto,
  UpdateArticleDto,
} from '../schemas';

@Injectable()
export class ArticleService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly ossService: OssService,
  ) {}

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
      total,
    };
  }

  async getArticle(id: string): Promise<Article | null> {
    const safeId = safeNumber(id, 0);
    if (!safeId) {
      return null;
    }

    return await this.prismaService.article.findUnique({
      where: { id: safeId },
    });
  }

  async createArticle(createArticleDto: CreateArticleDto): Promise<Article> {
    const article = await this.prismaService.article.create({
      data: createArticleDto,
    });

    return article;
  }

  async updateArticle(
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article | null> {
    const article = await this.prismaService.article.update({
      where: { id: updateArticleDto.id },
      data: updateArticleDto,
    });

    return article;
  }

  async removeArticle(id: string): Promise<boolean> {
    const safeId = safeNumber(id, 0);
    if (!safeId) {
      return false;
    }

    const result = await this.prismaService.article.delete({
      where: { id: safeId },
    });

    return !result;
  }

  uploadArticleImages(images: string[] = []) {
    return images.map((image) => this.ossService.getArticleUrl(image));
  }
}
