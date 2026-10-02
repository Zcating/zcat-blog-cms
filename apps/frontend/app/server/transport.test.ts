/**
 * Focused tests for the explicit-operation transport helpers.
 *
 * The transport layer replaces the legacy generic `HttpClient.post(path, ...)`
 * API. It exposes concrete functions (`postJson`, `postAuthorizedJson`,
 * `deleteAuthorized`) so domain code never picks an endpoint conditionally.
 *
 * Rules:
 * - No automatic retries.
 * - No `/api/bff/*` URLs (only the configured backend base URL).
 * - `Authorization` is forwarded only from the request Cookie when the
 *   caller asks for an authorized operation.
 * - The shared `fetch` boundary is the only thing that is mocked.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { CookieIO } from './cookies';
import { responseValidationError } from './result';
import {
  deleteAuthorized,
  getAuthorizedJson,
  postAuthorizedJson,
  postJson,
} from './transport';

const idObjectSchema = z.object({ id: z.number() });

function makeCookieIo(overrides: Partial<CookieIO> = {}): CookieIO {
  return {
    getCookie: vi.fn(() => undefined),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
    ...overrides,
  };
}

function makeFetch(response: {
  status?: number;
  body?: unknown;
  ok?: boolean;
}): typeof fetch {
  return vi.fn(async () => {
    const status = response.status ?? 200;
    const ok = response.ok ?? (status >= 200 && status < 300);
    return {
      status,
      ok,
      json: async () => response.body ?? null,
    } as Response;
  }) as unknown as typeof fetch;
}

const baseEnv = {
  resolveBaseUrl: () => 'http://backend.local/api',
};

let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});
afterEach(() => {
  process.env = originalEnv;
});

describe('postJson', () => {
  it('POSTs JSON to the resolved base URL + path and unwraps a success envelope', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: { id: 1 } },
    });
    const result = await postJson({
      path: '/widgets',
      body: { name: 'w' },
      env: baseEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    expect(result).toEqual({ id: 1 });

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/widgets');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ name: 'w' }));
  });

  it('does NOT include an Authorization header on a plain postJson call', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: null },
    });
    await postJson({
      path: '/public',
      body: {},
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc') }),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('throws a typed ResponseValidationError on a malformed success envelope', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: 'oops' },
    });
    const call = () =>
      postJson<{ id: number }>({
        path: '/widgets',
        body: {},
        env: baseEnv,
        cookie: makeCookieIo(),
        fetch: fetchImpl,
        dataSchema: idObjectSchema,
      });
    // Two unconditional rejection assertions cover the same shape that the
    // previous `try/catch` block did: the class (Error) and the
    // ResponseValidationError `name` discriminator.
    await expect(call()).rejects.toBeInstanceOf(Error);
    await expect(call()).rejects.toMatchObject({
      name: 'ResponseValidationError',
    });
  });

  it('does NOT retry on failure (one fetch call total)', async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 500,
      ok: false,
      json: async () => ({ code: 'ERR0006', message: 'fail', data: null }),
    })) as unknown as typeof fetch;
    await expect(
      postJson({
        path: '/widgets',
        body: {},
        env: baseEnv,
        cookie: makeCookieIo(),
        fetch: fetchImpl,
      }),
    ).rejects.toBeDefined();
    expect(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });

  it('uses the supplied env resolver (no VITE_* fallback) for the base URL', async () => {
    const customEnv = { resolveBaseUrl: () => 'http://override.local/api' };
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await postJson({
      path: '/x',
      body: {},
      env: customEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://override.local/api/x');
  });
});

describe('postAuthorizedJson', () => {
  it('forwards the Cookie Bearer as an Authorization header', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await postAuthorizedJson({
      path: '/private',
      body: {},
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc.def.ghi') }),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('re-wraps a raw-token Cookie so the backend always sees "Bearer <token>"', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await postAuthorizedJson({
      path: '/private',
      body: {},
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'raw-token') }),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBe('Bearer raw-token');
  });

  it('throws a typed ApiError when the backend rejects the session', async () => {
    const fetchImpl = makeFetch({
      body: { code: 'ERR0002', message: 'unauthorized', data: null },
    });
    await expect(
      postAuthorizedJson({
        path: '/private',
        body: {},
        env: baseEnv,
        cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer stale') }),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ _tag: 'LoginError', message: 'unauthorized' });
  });
});

describe('deleteAuthorized', () => {
  it('sends DELETE with Authorization forwarded from the Cookie', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: null },
    });
    await deleteAuthorized({
      path: '/private/1',
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc') }),
      fetch: fetchImpl,
    });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/private/1');
    expect(init.method).toBe('DELETE');
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('throws a typed ApiError when the backend returns a known error envelope', async () => {
    const fetchImpl = makeFetch({
      body: { code: 'ERR0003', message: 'db down', data: null },
    });
    await expect(
      deleteAuthorized({
        path: '/private/1',
        env: baseEnv,
        cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc') }),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ _tag: 'DatabaseError', message: 'db down' });
  });

  it('throws a typed ResponseValidationError for an unparseable success envelope', async () => {
    const fetchImpl = makeFetch({ body: { totally: 'invalid' } });
    await expect(
      deleteAuthorized({
        path: '/private/1',
        env: baseEnv,
        cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc') }),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

describe('transport — module re-exports', () => {
  it('exposes responseValidationError as a helper', () => {
    expect(typeof responseValidationError).toBe('function');
  });
});

describe('getAuthorizedJson', () => {
  it('GETs the resolved base URL + path with no query string when none is supplied', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: { id: 1 } },
    });
    const result = await getAuthorizedJson({
      path: '/widgets',
      env: baseEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    expect(result).toEqual({ id: 1 });

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/widgets');
    expect(init.method).toBe('GET');
    expect(init.headers.Accept).toBe('application/json');
    expect(init.body).toBeUndefined();
  });

  it('URL-encodes a query map (string + number values) and skips undefined', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await getAuthorizedJson({
      path: '/things',
      query: { page: 2, pageSize: 25, tag: 'hello world', unused: undefined },
      env: baseEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toContain('/things?');
    expect(url).toContain('page=2');
    expect(url).toContain('pageSize=25');
    expect(url).toContain('tag=hello%20world');
    expect(url).not.toContain('unused');
    expect(url).not.toContain('undefined');
  });

  it('forwards the Cookie Bearer as an Authorization header (with Bearer prefix)', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await getAuthorizedJson({
      path: '/private',
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer abc.def.ghi') }),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('re-wraps a raw-token Cookie so the backend always sees "Bearer <token>"', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await getAuthorizedJson({
      path: '/private',
      env: baseEnv,
      cookie: makeCookieIo({ getCookie: vi.fn(() => 'raw-token-only') }),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBe('Bearer raw-token-only');
  });

  it('omits the Authorization header when no session Cookie is present', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await getAuthorizedJson({
      path: '/public',
      env: baseEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('unwraps a success envelope and validates data against the provided Zod schema', async () => {
    const fetchImpl = makeFetch({
      body: {
        code: '0000',
        message: 'ok',
        data: { id: 42, name: 'widget' },
      },
    });
    const result = await getAuthorizedJson<{ id: number; name: string }>({
      path: '/widgets/42',
      env: baseEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
      dataSchema: z.object({ id: z.number(), name: z.string() }),
    });
    expect(result).toEqual({ id: 42, name: 'widget' });
  });

  it('throws a typed ApiError (no envelope data leakage) on a non-success envelope', async () => {
    const fetchImpl = makeFetch({
      body: { code: 'ERR0002', message: '会话已过期', data: { hint: 'leak' } },
    });
    await expect(
      getAuthorizedJson({
        path: '/private',
        env: baseEnv,
        cookie: makeCookieIo({ getCookie: vi.fn(() => 'Bearer stale') }),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ _tag: 'LoginError', message: '会话已过期' });
  });

  it('throws a typed ResponseValidationError when the body is missing the envelope', async () => {
    const fetchImpl = makeFetch({ body: { totally: 'invalid' } });
    await expect(
      getAuthorizedJson({
        path: '/x',
        env: baseEnv,
        cookie: makeCookieIo(),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });

  it('throws a typed ResponseValidationError when the success envelope fails the data schema', async () => {
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: { id: 'oops' } },
    });
    await expect(
      getAuthorizedJson<{ id: number }>({
        path: '/x',
        env: baseEnv,
        cookie: makeCookieIo(),
        fetch: fetchImpl,
        dataSchema: idObjectSchema,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });

  it('throws a typed ResponseValidationError when the body is not JSON', async () => {
    const fetchImpl = vi.fn(async () => ({
      status: 200,
      ok: true,
      json: async () => {
        throw new SyntaxError('bad json');
      },
    })) as unknown as typeof fetch;
    await expect(
      getAuthorizedJson({
        path: '/x',
        env: baseEnv,
        cookie: makeCookieIo(),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });

  it('issues exactly one fetch call (no retries) and reads the base URL from the injected env', async () => {
    const customEnv = { resolveBaseUrl: () => 'http://override.local/api' };
    const fetchImpl = makeFetch({
      body: { code: '0000', message: 'ok', data: {} },
    });
    await getAuthorizedJson({
      path: '/x',
      env: customEnv,
      cookie: makeCookieIo(),
      fetch: fetchImpl,
    });
    expect(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
    const [url] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://override.local/api/x');
  });
});
