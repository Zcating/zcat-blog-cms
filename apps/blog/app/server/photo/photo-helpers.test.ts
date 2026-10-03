import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackendUrlMissingError } from '@blog/server/env';
import { ApiErrorException } from '@blog/server/errors';
import { ResponseValidationError } from '@blog/server/result';

import { fetchPhotoList } from './photo-helpers';
import { getPhotoList } from './index';

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

const PHOTO = {
  id: 20,
  name: 'photo 20',
  url: 'https://cdn.example.com/newest.jpg',
  thumbnailUrl: 'https://cdn.example.com/newest_t.jpg',
  createdAt: '2026-05-20T00:00:00.000Z',
  albumId: 2,
  albumName: 'Album Two',
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

describe('fetchPhotoList', () => {
  it('GETs the photo list and unwraps the envelope', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          data: [PHOTO],
          total: 23,
          totalPages: 3,
          page: 1,
          pageSize: 12,
        },
      });
    });

    const result = await fetchPhotoList(
      { page: 1, pageSize: 12 },
      { fetch: fetchImpl },
    );

    expect(result.data[0]?.albumName).toBe('Album Two');
    expect(result.data[0]?.albumId).toBe(2);
    expect(result.total).toBe(23);
    expect(result.totalPages).toBe(3);
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/photo/list?page=1&pageSize=12',
    );
  });

  it('defaults page=1 and pageSize=12 when called with no arguments', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], total: 0, totalPages: 0, page: 1, pageSize: 12 },
      });
    });

    await fetchPhotoList(undefined, { fetch: fetchImpl });

    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/photo/list?page=1&pageSize=12',
    );
  });

  it('serves an empty photo feed without complaint', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], total: 0, totalPages: 0, page: 1, pageSize: 12 },
      }),
    );

    const result = await fetchPhotoList(undefined, { fetch: fetchImpl });

    expect(result.data).toEqual([]);
    expect(result.totalPages).toBe(0);
  });

  it('throws ApiErrorException when the backend returns a failure code', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0006', message: '未知错误' }),
    );

    await expect(
      fetchPhotoList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ApiErrorException);
  });

  it('throws ResponseValidationError when a photo row is missing its album name', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          data: [{ id: 1, name: 'p', url: 'u', thumbnailUrl: 't' }],
          total: 1,
          totalPages: 1,
          page: 1,
          pageSize: 12,
        },
      }),
    );

    await expect(
      fetchPhotoList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('throws BackendUrlMissingError when BACKEND_API_URL is absent', async () => {
    delete process.env.BACKEND_API_URL;
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchPhotoList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(BackendUrlMissingError);
  });
});

describe('photo server function wiring', () => {
  it('exposes a GET server function', () => {
    expect(getPhotoList.method).toBe('GET');
    expect(typeof getPhotoList.__executeServer).toBe('function');
  });
});
