import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackendUrlMissingError } from '@blog/server/env';
import { ApiErrorException } from '@blog/server/errors';
import { ResponseValidationError } from '@blog/server/result';

import { getUserInfo } from './index';
import { fetchUserInfo } from './user-helpers';

const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;

function makeFetch(
  responder: (input: RequestInfo | URL, init?: RequestInit) => Response,
) {
  return vi.fn(responder) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

const USER_INFO = {
  name: 'zcat',
  occupation: 'Engineer',
  abstract: 'Personal technical blog',
  aboutMe: 'About me',
  avatar: 'https://cdn.example.com/avatar.png',
  signedAvatar: 'https://bucket.example.com/avatar.png?sig=1',
  contact: { email: 'a@b.com', github: 'https://github.com/zcat' },
};

beforeEach(() => {
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});

afterEach(() => {
  if (ORIGINAL_BACKEND_URL === undefined) {
    delete process.env.BACKEND_API_URL;
  } else {
    process.env.BACKEND_API_URL = ORIGINAL_BACKEND_URL;
  }
});

describe('fetchUserInfo', () => {
  it('GETs the user-info endpoint and unwraps the envelope', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: USER_INFO,
      });
    });

    const result = await fetchUserInfo({ fetch: fetchImpl });

    expect(result.name).toBe('zcat');
    expect(result.contact.email).toBe('a@b.com');
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toBe('http://backend.local/api/blog/user-info');
  });

  it('defaults missing contact entries to empty strings', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { ...USER_INFO, contact: {} },
      }),
    );

    const result = await fetchUserInfo({ fetch: fetchImpl });

    expect(result.contact).toEqual({ email: '', github: '' });
  });

  it('defaults a non-object contact to empty strings', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { ...USER_INFO, contact: 'nope' },
      }),
    );

    const result = await fetchUserInfo({ fetch: fetchImpl });

    expect(result.contact).toEqual({ email: '', github: '' });
  });

  it('throws ApiErrorException when the backend returns a failure code', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常' }),
    );

    await expect(fetchUserInfo({ fetch: fetchImpl })).rejects.toBeInstanceOf(
      ApiErrorException,
    );
  });

  it('throws ResponseValidationError when a required field is missing', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { name: 'zcat' },
      }),
    );

    await expect(fetchUserInfo({ fetch: fetchImpl })).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it('throws ResponseValidationError when the body has no envelope', async () => {
    const fetchImpl = makeFetch(() => jsonResponse({ unexpected: true }));

    await expect(fetchUserInfo({ fetch: fetchImpl })).rejects.toBeInstanceOf(
      ResponseValidationError,
    );
  });

  it('throws BackendUrlMissingError when BACKEND_API_URL is absent', async () => {
    delete process.env.BACKEND_API_URL;
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(fetchUserInfo({ fetch: fetchImpl })).rejects.toBeInstanceOf(
      BackendUrlMissingError,
    );
  });
});

describe('user server function wiring', () => {
  it('exposes a GET server function', () => {
    expect(getUserInfo.method).toBe('GET');
    expect(typeof getUserInfo.__executeServer).toBe('function');
  });
});
