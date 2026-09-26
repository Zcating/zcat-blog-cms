import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { BackendUrlMissingError } from '@blog/server/env';
import { ApiErrorException } from '@blog/server/errors';
import { ResponseValidationError } from '@blog/server/result';

import { fetchGalleryDetail, fetchGalleryList } from './gallery-helpers';
import { getGalleryDetail, getGalleryList } from './index';

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
  id: 10,
  name: 'cover.jpg',
  url: 'https://cdn.example.com/cover.jpg',
  thumbnailUrl: 'https://cdn.example.com/cover_t.jpg',
  albumId: 1,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const GALLERY = {
  id: 1,
  name: 'Album 1',
  description: 'Desc 1',
  cover: PHOTO,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
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

describe('fetchGalleryList', () => {
  it('GETs the gallery list and unwraps the envelope', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [GALLERY], total: 1, page: 1, pageSize: 8 },
      });
    });

    const result = await fetchGalleryList(
      { page: 1, pageSize: 8 },
      { fetch: fetchImpl },
    );

    expect(result.data[0]?.cover?.url).toBe(PHOTO.url);
    expect(result.total).toBe(1);
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/gallery?page=1&pageSize=8',
    );
  });

  it('defaults page=1 and pageSize=8 when called with no arguments', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], total: 0, page: 1, pageSize: 8 },
      });
    });

    await fetchGalleryList(undefined, { fetch: fetchImpl });

    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/gallery?page=1&pageSize=8',
    );
  });

  it('accepts an album with a null cover', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          data: [{ ...GALLERY, cover: null }],
          total: 1,
          page: 1,
          pageSize: 8,
        },
      }),
    );

    const result = await fetchGalleryList(undefined, { fetch: fetchImpl });

    expect(result.data[0]?.cover).toBeNull();
  });

  it('throws ApiErrorException when the backend returns a failure code', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0006', message: '未知错误' }),
    );

    await expect(
      fetchGalleryList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ApiErrorException);
  });

  it('throws ResponseValidationError when totalPages is returned instead of total', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], totalPages: 2, page: 1, pageSize: 8 },
      }),
    );

    await expect(
      fetchGalleryList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('throws BackendUrlMissingError when BACKEND_API_URL is absent', async () => {
    delete process.env.BACKEND_API_URL;
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchGalleryList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(BackendUrlMissingError);
  });
});

describe('fetchGalleryDetail', () => {
  it('GETs the detail endpoint with the gallery id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { ...GALLERY, photos: [PHOTO, { ...PHOTO, id: 11 }] },
      });
    });

    const result = await fetchGalleryDetail({ id: '1' }, { fetch: fetchImpl });

    expect(result.photos).toHaveLength(2);
    expect(capturedUrl).toBe('http://backend.local/api/blog/gallery/1');
  });

  it('throws ApiErrorException when the backend returns a failure code', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '相册不存在' }),
    );

    await expect(
      fetchGalleryDetail({ id: '999' }, { fetch: fetchImpl }),
    ).rejects.toMatchObject({
      name: 'ApiErrorException',
      apiError: { _tag: 'DatabaseError', message: '相册不存在' },
    });
  });

  it('throws ResponseValidationError when a photo row is malformed', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { ...GALLERY, photos: [{ id: 'oops' }] },
      }),
    );

    await expect(
      fetchGalleryDetail({ id: '1' }, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('rejects a path-traversing id before issuing a request', async () => {
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchGalleryDetail({ id: '../admin' }, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('gallery server function wiring', () => {
  it('exposes GET server functions', () => {
    expect(getGalleryList.method).toBe('GET');
    expect(getGalleryDetail.method).toBe('GET');
    expect(typeof getGalleryList.__executeServer).toBe('function');
    expect(typeof getGalleryDetail.__executeServer).toBe('function');
  });
});
