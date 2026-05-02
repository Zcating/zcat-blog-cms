import { prismaService } from '../../../services';

export function findAll() {
  return prismaService.articleTag.findMany();
}

export function findById(id: string) {
  return prismaService.articleTag.findUnique({
    where: { id: parseInt(id, 10) },
  });
}

export function create(dto: { name: string }) {
  return prismaService.articleTag.create({
    data: dto,
  });
}

export function update(id: string, dto: { name?: string }) {
  return prismaService.articleTag.update({
    where: { id: parseInt(id, 10) },
    data: dto,
  });
}

export function deleteById(id: string) {
  return prismaService.articleTag.delete({
    where: { id: parseInt(id, 10) },
  });
}

export const articleTagService = {
  findAll,
  findById,
  create,
  update,
  delete: deleteById,
};
