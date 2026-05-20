import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { resetOssStrategy } from './oss.factory';

vi.mock('./qiniu.strategy', () => ({
  createQiniuStrategy: vi.fn().mockReturnValue({
    getPrivateUrl: vi.fn(),
    deleteFile: vi.fn(),
    getArticleUrl: vi.fn(),
    deleteArticleFile: vi.fn(),
    getBucket: vi.fn().mockReturnValue('mock-qiniu-bucket'),
    getUploadToken: vi.fn(),
  }),
}));

vi.mock('./minio.strategy', () => ({
  createMinioStrategy: vi.fn().mockReturnValue({
    getPrivateUrl: vi.fn(),
    deleteFile: vi.fn(),
    getArticleUrl: vi.fn(),
    deleteArticleFile: vi.fn(),
    getBucket: vi.fn().mockReturnValue('mock-minio-bucket'),
    getUploadToken: vi.fn(),
  }),
}));

describe('createOssStrategy', () => {
  beforeEach(() => {
    resetOssStrategy();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetOssStrategy();
  });

  it('should return minio strategy when OSS_PROVIDER is minio', async () => {
    Object.assign(process.env, { OSS_PROVIDER: 'minio' });
    const { createOssStrategy } = await import('./oss.factory');
    const strategy = createOssStrategy();
    expect(strategy).toBeDefined();
    expect(strategy.getBucket('photo')).toBe('mock-minio-bucket');
  });

  it('should return qiniu strategy when OSS_PROVIDER is qiniu', async () => {
    Object.assign(process.env, { OSS_PROVIDER: 'qiniu' });
    const { createOssStrategy } = await import('./oss.factory');
    const strategy = createOssStrategy();
    expect(strategy).toBeDefined();
    expect(strategy.getBucket('photo')).toBe('mock-qiniu-bucket');
  });

  it('should default to minio strategy when OSS_PROVIDER is not set', async () => {
    delete process.env.OSS_PROVIDER;
    const { createOssStrategy } = await import('./oss.factory');
    const strategy = createOssStrategy();
    expect(strategy).toBeDefined();
    expect(strategy.getBucket('photo')).toBe('mock-minio-bucket');
  });

  it('should cache strategy for subsequent calls', async () => {
    Object.assign(process.env, { OSS_PROVIDER: 'minio' });
    const { createOssStrategy } = await import('./oss.factory');

    const strategy1 = createOssStrategy();
    const strategy2 = createOssStrategy();

    expect(strategy1).toBe(strategy2);
  });
});
