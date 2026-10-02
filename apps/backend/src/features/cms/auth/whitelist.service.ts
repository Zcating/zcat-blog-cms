import * as crypto from 'node:crypto';

import { Effect } from 'effect';

import { logger } from '@backend/utils';
import { PrismaService, tryPromise } from '@backend/common/effect';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

interface CreateWhitelistParams {
  token: string;
  userId: number;
  device?: string;
  ip?: string;
  userAgent?: string;
  expiresAt: Date;
}

function create(params: CreateWhitelistParams) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const tokenHash = hashToken(params.token);

    return yield* tryPromise(() =>
      prisma.tokenWhitelist.create({
        data: {
          tokenHash,
          userId: params.userId,
          device: params.device ?? null,
          ip: params.ip ?? null,
          userAgent: params.userAgent ?? null,
          expiresAt: params.expiresAt,
        },
      }),
    );
  });
}

function validate(token: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const tokenHash = hashToken(token);

    const entry = yield* tryPromise(() =>
      prisma.tokenWhitelist.findUnique({ where: { tokenHash } }),
    );

    if (!entry) {
      return false;
    }

    if (entry.expiresAt < new Date()) {
      yield* tryPromise(() =>
        prisma.tokenWhitelist.deleteMany({ where: { tokenHash } }),
      );
      return false;
    }

    return true;
  });
}

function remove(token: string) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const tokenHash = hashToken(token);

    yield* tryPromise(() =>
      prisma.tokenWhitelist.deleteMany({ where: { tokenHash } }),
    );
  });
}

function removeByUser(userId: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    yield* tryPromise(() =>
      prisma.tokenWhitelist.deleteMany({ where: { userId } }),
    );
  });
}

function removeById(id: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    yield* tryPromise(() => prisma.tokenWhitelist.delete({ where: { id } }));
  });
}

function findByUser(userId: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.tokenWhitelist.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          device: true,
          ip: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
    );
  });
}

function cleanupExpired() {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    const result = yield* tryPromise(() =>
      prisma.tokenWhitelist.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      }),
    );

    if (result.count > 0) {
      logger.info(`Cleaned up ${result.count} expired token whitelist entries`);
    }

    return result.count;
  });
}

function countByUser(userId: number) {
  return Effect.gen(function* () {
    const prisma = yield* PrismaService;
    return yield* tryPromise(() =>
      prisma.tokenWhitelist.count({ where: { userId } }),
    );
  });
}

export const tokenWhitelistService = {
  create,
  validate,
  remove,
  removeByUser,
  removeById,
  findByUser,
  cleanupExpired,
  countByUser,
};
