import { Prisma } from '@prisma/client';

import { createPaginate, safeNumber } from '@backend/utils';

import { ossService, prismaService } from '../../../common';

export async function findAll(page: number, pageSize: number) {
  const result = await prismaService.article.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    ...createPaginate(page, pageSize),
    select: {
      id: true,
      title: true,
      excerpt: true,
      createdAt: true,
      updatedAt: true,
      createByUserId: true,
      publishAt: true,
    },
  });
  const total = await prismaService.article.count();

  return {
    data: result,
    totalPages: Math.ceil(total / pageSize),
    page,
    pageSize,
    total,
  };
}

export async function findById(id: string) {
  const safeId = safeNumber(id, 0);
  if (!safeId) {
    return null;
  }

  return prismaService.article.findUnique({
    where: { id: safeId },
  });
}

export async function create(dto: Prisma.ArticleCreateInput) {
  return prismaService.article.create({
    data: dto,
  });
}

export async function update(dto: Prisma.ArticleUpdateInput & { id: number }) {
  const { id, ...data } = dto;
  return prismaService.article.update({
    where: { id },
    data,
  });
}

export async function deleteById(id: string) {
  const safeId = safeNumber(id, 0);
  if (!safeId) {
    return false;
  }

  await prismaService.article.delete({
    where: { id: safeId },
  });

  return true;
}

export function getUploadUrls(images: string[]) {
  return images.map((image) => ossService.getArticleUrl(image));
}

export const articleService = {
  findAll,
  findById,
  create,
  update,
  delete: deleteById,
  getUploadUrls,
};
