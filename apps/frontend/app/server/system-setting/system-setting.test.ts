/**
 * Focused tests for the system-setting domain server-function lane.
 *
 * The only seam these tests touch is the global `fetch` boundary — every
 * other collaborator (env resolver, cookie reader, envelope parser, Zod
 * schema) is exercised through the actual exported `queryFn` helper and
 * `queryOptions` factory.
 *
 * Goals:
 * 1. The upload-config op GETs /cms/system-setting/upload-config?key=<key>
 *    on the resolved base URL with the session Cookie forwarded as
 *    `Authorization`.
 * 2. The envelope's `data` payload is unwrapped through the shared
 *    `parseEnvelope` helper, validated by the operation's Zod schema.
 * 3. Non-success envelopes throw a typed `ApiError`.
 * 4. The `queryOptions` factory exposes a stable queryKey + queryFn.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieIO } from '@cms/server/cookies';
import {
  systemSettingUploadUrlOptions,
  systemSettingUploadUrlQueryFn,
} from './index';

const testEnv = { resolveBaseUrl: () => 'http://backend.local/api' };

let originalEnv: NodeJS.ProcessEnv;
beforeEach(() => {
  originalEnv = { ...process.env };
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});
afterEach(() => {
  process.env = originalEnv;
  vi.unstubAllGlobals();
});

function makeCookieIo(cookieValue: string | undefined): CookieIO {
  return {
    getCookie: vi.fn(() => cookieValue),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  };
}

interface FetchCall {
  url: string;
  init: RequestInit;
}

function captureFetch(body: unknown, status = 200): FetchCall[] {
  const calls: FetchCall[] = [];
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({
        url: typeof input === 'string' ? input : input.toString(),
        init: init ?? {},
      });
      return {
        status,
        ok: status >= 200 && status < 300,
        json: async () => body,
      } as Response;
    },
  ) as unknown as typeof fetch;
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

describe('system-setting upload config', () => {
  const body = {
    code: '0000',
    message: 'ok',
    data: {
      presignedUrl:
        'http://localhost:9000/photos-bucket/test.jpg?presigned=abc',
    },
  };

  it('GETs /cms/system-setting/upload-config with the key as a query param and unwraps the data', async () => {
    const calls = captureFetch(body);
    const result = await systemSettingUploadUrlQueryFn({
      key: 'photos/test.jpg',
      env: testEnv,
      cookie: makeCookieIo(undefined),
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(
      'http://backend.local/api/cms/system-setting/upload-config?key=photos%2Ftest.jpg',
    );
    expect(calls[0].init.method).toBe('GET');
    expect(result).toEqual(body.data);
  });

  it('forwards a Bearer session Cookie as Authorization on the GET', async () => {
    const calls = captureFetch(body);
    await systemSettingUploadUrlQueryFn({
      key: 'photos/test.jpg',
      env: testEnv,
      cookie: makeCookieIo('Bearer abc.def.ghi'),
    });

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc.def.ghi');
  });

  it('omits the Authorization header when no session Cookie is present', async () => {
    const calls = captureFetch(body);
    await systemSettingUploadUrlQueryFn({
      key: 'photos/test.jpg',
      env: testEnv,
      cookie: makeCookieIo(undefined),
    });

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws a typed ApiError on a non-success envelope', async () => {
    captureFetch({ code: 'ERR0006', message: 'boom', data: null });
    await expect(
      systemSettingUploadUrlQueryFn({
        key: 'photos/test.jpg',
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      _tag: 'UnknownError',
      message: 'boom',
    });
  });

  it('throws a typed ResponseValidationError when the data payload fails the schema', async () => {
    captureFetch({
      code: '0000',
      message: 'ok',
      data: { presignedUrl: 42 },
    });
    await expect(
      systemSettingUploadUrlQueryFn({
        key: 'photos/test.jpg',
        env: testEnv,
        cookie: makeCookieIo(undefined),
      }),
    ).rejects.toMatchObject({
      name: 'ResponseValidationError',
    });
  });

  it('exposes a stable queryOptions shape (queryKey includes the key, queryFn)', () => {
    const opts = systemSettingUploadUrlOptions('photos/test.jpg');
    expect(opts.queryKey).toEqual([
      'system-setting',
      'upload-url',
      'photos/test.jpg',
    ]);
    expect(typeof opts.queryFn).toBe('function');
  });
});
