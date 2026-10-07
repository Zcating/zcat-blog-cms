import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { StatisticsApi } from '@blog/features/layouts/statistics-api';

import { resolveBackendApiUrl } from './env';
import { forwardVisitRequest } from './visitor';

vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: async () => ({ get: async () => ({ visitorId: 'fp-1' }) }),
  },
}));

vi.mock('@originjs/crypto-js-wasm', () => ({
  default: {
    MD5: Object.assign(() => 'digest', {
      loadWasm: async () => undefined,
    }),
  },
}));

const BACKEND_BASE = 'http://backend.local:9090/api';

const MOUNT = '/api';

const BLOG_ORIGIN = 'http://blog.invalid';

beforeEach(() => {
  vi.stubEnv('BACKEND_API_URL', BACKEND_BASE);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function jsonOk(): Response {
  return new Response(JSON.stringify({ code: '0000', message: 'success' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

async function pathClientPosts(): Promise<string> {
  const posted: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    posted.push(String(input));
    return jsonOk();
  }) as typeof fetch;
  try {
    await StatisticsApi.uploadVisitRecord('/post-board', 'Post Board');
  } finally {
    globalThis.fetch = originalFetch;
  }
  return new URL(posted[0] ?? '', BLOG_ORIGIN).pathname;
}

async function pathServerForwardsTo(clientPath: string): Promise<string> {
  const forwarded: string[] = [];
  await forwardVisitRequest(
    new Request(`${BLOG_ORIGIN}${clientPath}`, { method: 'POST' }),
    {
      env: { resolveBaseUrl: () => resolveBackendApiUrl() },
      fetch: (async (input: RequestInfo | URL) => {
        forwarded.push(String(input));
        return new Response('{}');
      }) as typeof fetch,
    },
  );
  return new URL(forwarded[0] ?? '').pathname;
}

function mountOf(pathname: string): string {
  const segments = pathname.split('/').filter((entry) => entry.length > 0);
  return `/${segments[0] ?? ''}`;
}

describe('backend address: one concept, two representations', () => {
  it('forwards to exactly the path the browser posted', async () => {
    const clientPath = await pathClientPosts();

    expect(await pathServerForwardsTo(clientPath)).toBe(clientPath);
  });

  it('mounts both representations on /api', async () => {
    const clientPath = await pathClientPosts();

    expect(mountOf(clientPath)).toBe(MOUNT);
    expect(new URL(resolveBackendApiUrl()).pathname).toBe(MOUNT);
  });

  it('addresses the mount rather than a backend origin the browser could resolve directly', async () => {
    const clientPath = await pathClientPosts();

    expect(clientPath.startsWith(MOUNT)).toBe(true);
    expect(clientPath).not.toContain('backend.local');
  });
});
