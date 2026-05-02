import { prismaService } from '../../../services';

export class ArticleTagService {
  findAll() {
    return prismaService.articleTag.findMany();
  }

  findById(id: string) {
    return prismaService.articleTag.findUnique({
      where: { id: parseInt(id, 10) },
    });
  }

  create(dto: { name: string }) {
    return prismaService.articleTag.create({
      data: dto,
    });
  }

  update(id: string, dto: { name?: string }) {
    return prismaService.articleTag.update({
      where: { id: parseInt(id, 10) },
      data: dto,
    });
  }

  delete(id: string) {
    return prismaService.articleTag.delete({
      where: { id: parseInt(id, 10) },
    });
  }
}

export const articleTagService = new ArticleTagService();
