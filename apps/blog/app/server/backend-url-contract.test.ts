import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendApiUrl } from './env';

const BLOG_DIR = join(import.meta.dirname, '..', '..');
const REPO_ROOT = join(BLOG_DIR, '..', '..');

const BACKEND_MOUNT = '/api';

const PROBE_PATH = 'mount-probe';

const BLOG_ENV = join(BLOG_DIR, '.env');
const BLOG_ENV_EXAMPLE = join(BLOG_DIR, '.env.example');
const BLOG_ENV_DEVELOPMENT = join(BLOG_DIR, '.env.development');
const BLOG_ENV_PRODUCTION = join(BLOG_DIR, '.env.production');
const DEPLOY_ENV = join(REPO_ROOT, '.env.deploy');
const DEPLOY_ENV_DEV = join(REPO_ROOT, '.env.deploy.dev');
const DEPLOY_ENV_EXAMPLE = join(REPO_ROOT, '.env.deploy.example');

const PAIRED_FILES = [
  BLOG_ENV,
  BLOG_ENV_EXAMPLE,
  DEPLOY_ENV,
  DEPLOY_ENV_DEV,
  DEPLOY_ENV_EXAMPLE,
];

const CLIENT_FILES = [
  BLOG_ENV,
  BLOG_ENV_EXAMPLE,
  BLOG_ENV_DEVELOPMENT,
  BLOG_ENV_PRODUCTION,
  DEPLOY_ENV,
  DEPLOY_ENV_DEV,
  DEPLOY_ENV_EXAMPLE,
];

const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;

function readEnvValue(file: string, key: string): string | undefined {
  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => new RegExp(`^${key}\\s*=`).test(entry));
  return line?.split('=').slice(1).join('=').trim();
}

function mountOf(baseUrl: string): string {
  const withoutQueryOrHash = baseUrl.split(/[?#]/)[0] ?? '';
  const withoutOrigin = withoutQueryOrHash.replace(
    /^[a-z][a-z0-9+.-]*:\/\/[^/]*/i,
    '',
  );
  const segments = withoutOrigin.split('/').filter((entry) => entry.length > 0);
  return `/${segments[segments.length - 1] ?? ''}`;
}

async function captureRequest(call: () => Promise<unknown>): Promise<string> {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requested.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => ({ code: '0000', message: 'success' }),
    } as Response;
  }) as typeof fetch;
  try {
    await call();
  } finally {
    globalThis.fetch = originalFetch;
  }
  return requested[0] ?? '';
}

async function clientBaseFor(viteApiUrl: string): Promise<string> {
  vi.stubEnv('VITE_API_URL', viteApiUrl);
  vi.resetModules();
  const { HttpClient } = await import('@blog/apis/http/http-client');
  const requested = await captureRequest(() => HttpClient.post(PROBE_PATH, {}));
  return requested.slice(0, requested.length - PROBE_PATH.length - 1);
}

function serverBaseFor(backendApiUrl: string): string {
  process.env.BACKEND_API_URL = backendApiUrl;
  return resolveBackendApiUrl();
}

function existing(files: string[]): string[] {
  return files.filter((file) => existsSync(file));
}

function present(files: string[], key: string): string[] {
  return existing(files).filter((file) => readEnvValue(file, key));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  if (ORIGINAL_BACKEND_URL === undefined) {
    delete process.env.BACKEND_API_URL;
  } else {
    process.env.BACKEND_API_URL = ORIGINAL_BACKEND_URL;
  }
});

describe('backend address: one concept, two representations', () => {
  it.each(present(PAIRED_FILES, 'BACKEND_API_URL'))(
    'resolves the client and the server representation in %s to the same mount',
    async (file) => {
      const clientValue = readEnvValue(file, 'VITE_API_URL');
      const serverValue = readEnvValue(file, 'BACKEND_API_URL');
      if (!clientValue || !serverValue) {
        throw new Error(`${file} must declare both representations`);
      }

      const clientBase = await clientBaseFor(clientValue);
      const serverBase = serverBaseFor(serverValue);

      expect(mountOf(clientBase)).toBe(mountOf(serverBase));
    },
  );

  it.each(present(CLIENT_FILES, 'VITE_API_URL'))(
    'addresses the /api mount in %s, not the deleted /api/bff surface',
    async (file) => {
      const clientValue = readEnvValue(file, 'VITE_API_URL');
      if (!clientValue) throw new Error(`${file} must declare VITE_API_URL`);

      const clientBase = await clientBaseFor(clientValue);

      expect(mountOf(clientBase)).toBe(BACKEND_MOUNT);
    },
  );

  it('posts the visit record under the same mount the server-side reads use', async () => {
    const clientValue = readEnvValue(DEPLOY_ENV_EXAMPLE, 'VITE_API_URL');
    const serverValue = readEnvValue(DEPLOY_ENV_EXAMPLE, 'BACKEND_API_URL');
    if (!clientValue || !serverValue) {
      throw new Error(
        `${DEPLOY_ENV_EXAMPLE} must declare both representations`,
      );
    }

    const serverBase = serverBaseFor(serverValue);
    vi.stubEnv('VITE_API_URL', clientValue);
    vi.resetModules();
    const { HttpClient } = await import('@blog/apis/http/http-client');
    const requested = await captureRequest(() =>
      HttpClient.post('blog/visitor', { pagePath: '/post-board' }),
    );

    expect(new URL(requested, 'http://blog.invalid').pathname).toBe(
      `${mountOf(serverBase)}/blog/visitor`,
    );
  });
});
