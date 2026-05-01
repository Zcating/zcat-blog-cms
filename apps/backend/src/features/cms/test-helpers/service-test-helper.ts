import { vi } from 'vitest';

export function createPrismaServiceMock() {
  return {
    article: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    articleTag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    photo: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateMany: vi.fn(),
    },
    photoAlbum: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userInfo: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    statistic: {
      create: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  };
}

export type PrismaServiceMock = ReturnType<typeof createPrismaServiceMock>;

export function createOssServiceMock() {
  return {
    getArticleUrl: vi.fn((filename: string) => `article://${filename}`),
    getPrivateUrl: vi.fn((filename: string) => `private://${filename}`),
    deleteFile: vi.fn().mockResolvedValue(true),
    getBucket: vi.fn((type: 'article' | 'photo') => `${type}-bucket`),
  };
}

export type OssServiceMock = ReturnType<typeof createOssServiceMock>;

export function createJwtServiceMock() {
  return {
    sign: vi.fn(() => 'signed-token'),
  };
}

export type JwtServiceMock = ReturnType<typeof createJwtServiceMock>;

export function createConfigServiceMock(values: Record<string, string> = {}) {
  return {
    get: vi.fn((key: string) => values[key]),
  };
}

export type ConfigServiceMock = ReturnType<typeof createConfigServiceMock>;

export function createDate(value: string = '2026-01-01T00:00:00.000Z') {
  return new Date(value);
}
