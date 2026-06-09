import { Effect } from 'effect';

import { PrismaService, tryPromise } from '../../../common/effect';

export function findAll() {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() => prisma.articleTag.findMany());
  });
}

export function findById(id: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.articleTag.findUnique({ where: { id: parseInt(id, 10) } }),
    );
  });
}

export function create(dto: { name: string }) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.articleTag.create({ data: dto }),
    );
  });
}

export function update(id: string, dto: { name?: string }) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.articleTag.update({
        where: { id: parseInt(id, 10) },
        data: dto,
      }),
    );
  });
}

export function deleteById(id: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    yield* tryPromise(() =>
      prisma.articleTag.delete({ where: { id: parseInt(id, 10) } }),
    );
  });
}

export const articleTagService = {
  findAll,
  findById,
  create,
  update,
  delete: deleteById,
};
