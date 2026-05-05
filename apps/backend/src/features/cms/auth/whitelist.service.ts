import * as crypto from 'node:crypto';

import { logger } from '@backend/utils';

import { prismaService } from '../../../common';

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

async function create(params: CreateWhitelistParams) {
  const tokenHash = hashToken(params.token);

  return prismaService.tokenWhitelist.create({
    data: {
      tokenHash,
      userId: params.userId,
      device: params.device ?? null,
      ip: params.ip ?? null,
      userAgent: params.userAgent ?? null,
      expiresAt: params.expiresAt,
    },
  });
}

async function validate(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);

  const entry = await prismaService.tokenWhitelist.findUnique({
    where: { tokenHash },
  });

  if (!entry) {
    return false;
  }

  if (entry.expiresAt < new Date()) {
    await prismaService.tokenWhitelist.deleteMany({
      where: { tokenHash },
    });
    return false;
  }

  return true;
}

async function remove(token: string) {
  const tokenHash = hashToken(token);

  await prismaService.tokenWhitelist.deleteMany({
    where: { tokenHash },
  });
}

async function removeByUser(userId: number) {
  await prismaService.tokenWhitelist.deleteMany({
    where: { userId },
  });
}

async function removeById(id: number) {
  await prismaService.tokenWhitelist.delete({
    where: { id },
  });
}

async function findByUser(userId: number) {
  return prismaService.tokenWhitelist.findMany({
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
  });
}

async function cleanupExpired() {
  const result = await prismaService.tokenWhitelist.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  if (result.count > 0) {
    logger.info(`Cleaned up ${result.count} expired token whitelist entries`);
  }

  return result.count;
}

async function countByUser(userId: number): Promise<number> {
  return prismaService.tokenWhitelist.count({
    where: { userId },
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
