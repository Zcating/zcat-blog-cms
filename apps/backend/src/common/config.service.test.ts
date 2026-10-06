import { afterEach, describe, expect, it, vi } from 'vitest';

const BASE_ENV = {
  DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  JWT_SECRET: 'test-secret',
  OSS_ENDPOINT: 'https://s3.oss-cn-guangzhou.aliyuncs.com',
  OSS_ACCESS_KEY: 'test-access-key',
  OSS_SECRET_KEY: 'test-secret-key',
  OSS_BUCKET: 'pictures',
};

async function loadConfig(overrides: Record<string, string | undefined> = {}) {
  vi.resetModules();
  for (const [key, value] of Object.entries({ ...BASE_ENV, ...overrides })) {
    vi.stubEnv(key, value);
  }
  const { config } = await import('./config.service');
  return config;
}

describe('config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('object storage', () => {
    it('exposes the four Aliyun OSS variables the SDK needs', async () => {
      const config = await loadConfig();

      expect(config.ossEndpoint).toBe(
        'https://s3.oss-cn-guangzhou.aliyuncs.com',
      );
      expect(config.ossAccessKey).toBe('test-access-key');
      expect(config.ossSecretKey).toBe('test-secret-key');
      expect(config.ossBucket).toBe('pictures');
    });

    it.each(['OSS_ENDPOINT', 'OSS_ACCESS_KEY', 'OSS_SECRET_KEY', 'OSS_BUCKET'])(
      'refuses to start without %s',
      async (key) => {
        await expect(loadConfig({ [key]: undefined })).rejects.toThrow(
          `Missing required environment variable: ${key}`,
        );
      },
    );

    it('no longer carries the MinIO-era port, scheme and public-url accessors', async () => {
      const config = await loadConfig();

      expect(config).not.toHaveProperty('ossPort');
      expect(config).not.toHaveProperty('ossUseSsl');
      expect(config).not.toHaveProperty('ossPublicUrl');
    });
  });
});
