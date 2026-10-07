import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendApiUrl } from './env';

const BACKEND_MOUNT = '/api';

const VISIT_PATH = '/api/blog/visitor';

const CLIENT_MOUNT = '/api';

const SERVER_BASE = 'http://backend.local:9090/api';

function mountOf(baseUrl: string): string {
  const withoutOrigin = baseUrl.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
  const segments = withoutOrigin.split('/').filter((entry) => entry.length > 0);
  return `/${segments[segments.length - 1] ?? ''}`;
}

function clientMountOf(pathname: string): string {
  const segments = pathname.split('/').filter((entry) => entry.length > 0);
  return `/${segments[0] ?? ''}`;
}

async function clientRequestPath(): Promise<string> {
  const originalFetch = globalThis.fetch;
  const requested: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requested.push(String(input));
    return {
      ok: true,
      status: 200,
      json: async () => ({ code: '0000', message: 'success', data: null }),
    } as Response;
  }) as typeof fetch;
  try {
    await fetch(VISIT_PATH, { method: 'POST' });
  } finally {
    globalThis.fetch = originalFetch;
  }
  return new URL(requested[0] ?? '', 'http://blog.invalid').pathname;
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
    const clientBase = new URL(
      await clientRequestPath(),
      'http://blog.invalid',
    );
    const serverBase = serverBaseFor(SERVER_BASE);

    expect(clientMountOf(clientBase.pathname)).toBe(mountOf(serverBase));
  });

  it('addresses the /api mount, not the deleted /api/bff surface', async () => {
    const clientBase = new URL(
      await clientRequestPath(),
      'http://blog.invalid',
    );

    expect(clientMountOf(clientBase.pathname)).toBe(BACKEND_MOUNT);
  });

  it('posts the visit record under the same mount the server-side reads use', async () => {
    const clientBase = new URL(
      await clientRequestPath(),
      'http://blog.invalid',
    );
    const serverBase = serverBaseFor(SERVER_BASE);

    expect(
      `${mountOf(serverBase)}${clientBase.pathname.slice(BACKEND_MOUNT.length)}`,
    ).toBe(`${BACKEND_MOUNT}/blog/visitor`);
  });
});
