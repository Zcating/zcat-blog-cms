import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendApiUrl } from './env';

const BACKEND_MOUNT = '/api';

const PROBE_PATH = 'mount-probe';

const CLIENT_BASE = '/api';

const SERVER_BASE = 'http://backend.local:9090/api';

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
  vi.stubEnv('BACKEND_API_URL', backendApiUrl);
  return resolveBackendApiUrl();
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('backend address: one concept, two representations', () => {
  it('resolves the client and the server representation to the same mount', async () => {
    const clientBase = await clientBaseFor(CLIENT_BASE);
    const serverBase = serverBaseFor(SERVER_BASE);

    expect(mountOf(clientBase)).toBe(mountOf(serverBase));
  });

  it('addresses the /api mount, not the deleted /api/bff surface', async () => {
    const clientBase = await clientBaseFor(CLIENT_BASE);

    expect(mountOf(clientBase)).toBe(BACKEND_MOUNT);
  });

  it('posts the visit record under the same mount the server-side reads use', async () => {
    const serverBase = serverBaseFor(SERVER_BASE);
    vi.stubEnv('VITE_API_URL', CLIENT_BASE);
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
