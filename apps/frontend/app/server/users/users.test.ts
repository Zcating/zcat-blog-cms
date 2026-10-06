/*
 * Mocking policy:
 *   - The ONLY thing tests may mock is the external Fastify fetch boundary.
 *   - No internal Start / helper / transport mocks.
 *   - No raw-handler-only seam: tests exercise the pure helper that the
 *     server function delegates to, with `fetch` injected.
 *
 * The pure helpers live in `./users-helpers.ts` (sibling) so that the
 * server functions in `./index.ts` remain a thin TanStack Start shell
 * around them. This keeps the testable boundary identical to the
 * production boundary (same transport call, same shape contract).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieIO } from '../cookies';

import {
  fetchCurrentUser,
  updateCurrentUser,
  fetchSessionValidity,
} from './users-helpers';

import { isValidQueryOptions, userInfoQueryOptions } from './index';

const baseEnv = {
  resolveBaseUrl: () => 'http://backend.local/api',
};

function makeCookieIo(cookieValue: string | undefined): CookieIO {
  return {
    getCookie: vi.fn(() => cookieValue),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  };
}

function makeFetch(body: unknown, status = 200): typeof fetch {
  return vi.fn(async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  })) as unknown as typeof fetch;
}

let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});
afterEach(() => {
  process.env = originalEnv;
});

// ---------------------------------------------------------------------------
// fetchCurrentUser
// ---------------------------------------------------------------------------

describe('fetchCurrentUser', () => {
  it('GETs /cms/user-info, forwards the Bearer Cookie, and parses contact JSON', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: {
        name: 'Admin',
        contact: '{"email":"admin@test.com","github":"admin"}',
        occupation: 'Developer',
        avatar: 'avatar.jpg',
        signedAvatar: 'https://signed.example/avatar.jpg',
        aboutMe: 'About me',
        abstract: 'Abstract',
      },
    });

    const result = await fetchCurrentUser({
      env: baseEnv,
      cookie: makeCookieIo('Bearer abc.def.ghi'),
      fetch: fetchImpl,
    });

    expect(result).toEqual({
      name: 'Admin',
      contact: { email: 'admin@test.com', github: 'admin' },
      occupation: 'Developer',
      avatar: 'avatar.jpg',
      signedAvatar: 'https://signed.example/avatar.jpg',
      aboutMe: 'About me',
      abstract: 'Abstract',
    });

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/cms/user-info');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('tolerates a contact payload that is already an object (defensive parse)', async () => {
    // The backend currently serialises contact as a JSON string. Some
    // mock or future deployment may send an object directly. Both must
    // succeed at the boundary.
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: {
        name: 'Admin',
        contact: { email: 'a@b.com', github: 'g' },
        occupation: '',
        avatar: '',
        signedAvatar: '',
        aboutMe: '',
        abstract: '',
      },
    });

    const result = await fetchCurrentUser({
      env: baseEnv,
      cookie: makeCookieIo('Bearer t'),
      fetch: fetchImpl,
    });

    expect(result.contact).toEqual({ email: 'a@b.com', github: 'g' });
  });

  it('rejects a malformed success envelope with a typed ResponseValidationError', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: { name: 123, contact: 'not-an-object', occupation: null },
    });

    await expect(
      fetchCurrentUser({
        env: baseEnv,
        cookie: makeCookieIo('Bearer t'),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });

  it('throws a typed ApiError on a non-success envelope (no data leakage)', async () => {
    const fetchImpl = makeFetch({
      code: 'ERR0002',
      message: '会话已过期',
      data: { hint: 'internal' },
    });

    await expect(
      fetchCurrentUser({
        env: baseEnv,
        cookie: makeCookieIo('Bearer stale'),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ _tag: 'LoginError', message: '会话已过期' });
  });
});

// ---------------------------------------------------------------------------
// updateCurrentUser
// ---------------------------------------------------------------------------

describe('updateCurrentUser', () => {
  it('POSTs /cms/user-info/update with a typed body and parses the response', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: {
        name: 'Updated',
        contact: '{"email":"u@test.com","github":"u"}',
        occupation: 'Dev',
        avatar: '',
        signedAvatar: '',
        aboutMe: '',
        abstract: '',
      },
    });

    const result = await updateCurrentUser({
      env: baseEnv,
      cookie: makeCookieIo('Bearer t'),
      fetch: fetchImpl,
      body: {
        name: 'Updated',
        contact: { email: 'u@test.com', github: 'u' },
        occupation: 'Dev',
        avatar: '',
        aboutMe: '',
        abstract: '',
      },
    });

    expect(result.contact).toEqual({ email: 'u@test.com', github: 'u' });
    expect(result.name).toBe('Updated');

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/cms/user-info/update');
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers.Authorization).toBe('Bearer t');

    const sentBody = JSON.parse(init.body as string);
    expect(sentBody.name).toBe('Updated');
    // Backend schema expects contact as an object — the helper must
    // send an object, NOT a pre-serialised JSON string.
    expect(sentBody.contact).toEqual({ email: 'u@test.com', github: 'u' });
  });

  it('maps ERR0005 (validation error) to a typed ValidationError ApiError', async () => {
    const fetchImpl = makeFetch({
      code: 'ERR0005',
      message: 'failed',
      data: null,
    });

    await expect(
      updateCurrentUser({
        env: baseEnv,
        cookie: makeCookieIo('Bearer t'),
        fetch: fetchImpl,
        body: {
          name: 'Updated',
          contact: { email: 'u@test.com', github: 'u' },
        },
      }),
    ).rejects.toMatchObject({ _tag: 'ValidationError', message: 'failed' });
  });

  it('rejects when name is missing in the typed body (Zod boundary)', async () => {
    await expect(
      updateCurrentUser({
        env: baseEnv,
        cookie: makeCookieIo('Bearer t'),
        fetch: makeFetch({ code: '0000', message: 'ok', data: {} }),
        body: {
          contact: { email: 'u@test.com', github: 'u' },
        } as never,
      }),
    ).rejects.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// fetchSessionValidity
// ---------------------------------------------------------------------------

describe('fetchSessionValidity', () => {
  it('POSTs /auth/is-valid and unwraps { valid: true }', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: { valid: true },
    });

    const result = await fetchSessionValidity({
      env: baseEnv,
      cookie: makeCookieIo('Bearer abc'),
      fetch: fetchImpl,
    });

    expect(result).toBe(true);

    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe('http://backend.local/api/auth/is-valid');
    expect(init.method).toBe('POST');
    // The session validity check still has to forward the Bearer —
    // otherwise the backend cannot tell *whose* session to validate.
    expect(init.headers.Authorization).toBe('Bearer abc');
  });

  it('returns false when the backend reports valid=false', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: { valid: false },
    });

    const result = await fetchSessionValidity({
      env: baseEnv,
      cookie: makeCookieIo('Bearer stale'),
      fetch: fetchImpl,
    });

    expect(result).toBe(false);
  });

  it('throws ResponseValidationError when the envelope lacks the boolean', async () => {
    const fetchImpl = makeFetch({
      code: '0000',
      message: 'ok',
      data: { valid: 'yes-please' },
    });

    await expect(
      fetchSessionValidity({
        env: baseEnv,
        cookie: makeCookieIo('Bearer t'),
        fetch: fetchImpl,
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

// ---------------------------------------------------------------------------
// Stable queryOptions
// ---------------------------------------------------------------------------

describe('userInfoQueryOptions', () => {
  it('returns a stable queryOptions object with the expected key and queryFn', () => {
    const options = userInfoQueryOptions();

    expect(options.queryKey).toEqual(['users', 'current']);
    expect(typeof options.queryFn).toBe('function');
  });

  it('produces referentially-stable options across calls', () => {
    // Stable identity is required so Phase 3 consumers can place the
    // options in module-scope consts without re-running the factory.
    const a = userInfoQueryOptions();
    const b = userInfoQueryOptions();
    expect(a).toBe(b);
  });
});

describe('isValidQueryOptions', () => {
  it('returns a stable queryOptions object with the expected key and queryFn', () => {
    const options = isValidQueryOptions();

    expect(options.queryKey).toEqual(['users', 'session', 'validity']);
    expect(typeof options.queryFn).toBe('function');
  });

  it('produces referentially-stable options across calls', () => {
    const a = isValidQueryOptions();
    const b = isValidQueryOptions();
    expect(a).toBe(b);
  });
});
