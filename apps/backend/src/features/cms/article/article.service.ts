import { Effect } from 'effect';
import { Prisma } from '@backend/prisma';

import { createPaginate, safeNumber } from '@backend/utils';
import { OssService, PrismaService, tryPromise } from '../../../common/effect';

export function findAll(page: number, pageSize: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const result = yield* tryPromise(() =>
      prisma.article.findMany({
        orderBy: { createdAt: 'desc' },
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
      }),
    );
    const total = yield* tryPromise(() => prisma.article.count());

    return {
      data: result,
      totalPages: Math.ceil(total / pageSize),
      page,
      pageSize,
      total,
    };
  });
}

export function findById(id: string) {
  return Effect.gen(function* () {
    const safeId = safeNumber(id, 0);
    if (!safeId) {
      return null;
    }

    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.article.findUnique({ where: { id: safeId } }),
    );
  });
}

export function create(dto: Prisma.ArticleCreateInput) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() => prisma.article.create({ data: dto }));
  });
}

export function update(dto: Prisma.ArticleUpdateInput & { id: number }) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const { id, ...data } = dto;
    return yield* tryPromise(() =>
      prisma.article.update({ where: { id }, data }),
    );
  });
}

export function deleteById(id: string) {
  return Effect.gen(function* () {
    const safeId = safeNumber(id, 0);
    if (!safeId) {
      return false;
    }

    const prisma = yield* PrismaService;
    yield* tryPromise(() => prisma.article.delete({ where: { id: safeId } }));
    return true;
  });
}

export function getUploadUrls(images: string[]) {
  return Effect.gen(function* () {
    const oss = yield* OssService;
    return yield* Effect.all(
      images.map((image) => tryPromise(() => oss.presignDownloadUrl(image))),
      { concurrency: 'unbounded' },
    );
  });
}

export const articleService = {
  findAll,
  findById,
  create,
  update,
  delete: deleteById,
  getUploadUrls,
};
