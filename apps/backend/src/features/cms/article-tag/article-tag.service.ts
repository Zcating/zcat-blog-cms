import { Injectable } from '@nestjs/common';

import { PrismaService } from '@backend/common';

import { CreateArticleTagDto, UpdateArticleTagDto } from './article-tag.schema';

@Injectable()
export class ArticleTagService {
  constructor(private prismaService: PrismaService) {}

  async findAll() {
    return this.prismaService.articleTag.findMany();
  }

  async findOne(id: string) {
    return this.prismaService.articleTag.findUnique({
      where: { id: parseInt(id, 10) },
    });
  }

  async create(createArticleTagDto: CreateArticleTagDto) {
    return this.prismaService.articleTag.create({
      data: createArticleTagDto,
    });
  }

  async update(id: string, updateArticleTagDto: UpdateArticleTagDto) {
    return this.prismaService.articleTag.update({
      where: { id: parseInt(id, 10) },
      data: updateArticleTagDto,
    });
  }

  async remove(id: string) {
    return this.prismaService.articleTag.delete({
      where: { id: parseInt(id, 10) },
    });
  }
}
