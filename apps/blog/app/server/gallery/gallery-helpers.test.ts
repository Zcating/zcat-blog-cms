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
  url: 'cover.jpg',
  signedUrl:
    'https://bucket.oss-cn-guangzhou.aliyuncs.com/cover.jpg?OSSAccessKeyId=x&Expires=1',
  signedThumbnailUrl:
    'https://bucket.oss-cn-guangzhou.aliyuncs.com/cover.thumbnail.jpg?OSSAccessKeyId=x&Expires=1',
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
        data: {
          data: [GALLERY],
          total: 23,
          totalPages: 3,
          page: 1,
          pageSize: 8,
        },
      });
    });

    const result = await fetchGalleryList(
      { page: 1, pageSize: 8 },
      { fetch: fetchImpl },
    );

    expect(result.data[0]?.cover?.url).toBe(PHOTO.url);
    expect(result.data[0]?.cover?.signedUrl).toBe(PHOTO.signedUrl);
    expect(result.total).toBe(23);
    expect(result.totalPages).toBe(3);
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
        data: { data: [], total: 0, totalPages: 0, page: 1, pageSize: 8 },
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
          totalPages: 1,
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

  it('accepts the album list payload the backend now sends, which carries totalPages alongside total', async () => {
    const payload = {
      data: [GALLERY, { ...GALLERY, id: 2 }],
      total: 7,
      totalPages: 4,
      page: 2,
      pageSize: 2,
    };
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: '0000', message: 'success', data: payload }),
    );

    const result = await fetchGalleryList(
      { page: 2, pageSize: 2 },
      { fetch: fetchImpl },
    );

    expect(result).toEqual(payload);
  });

  it('reports total as the grand total from the count query, not the length of this page', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          data: [GALLERY, { ...GALLERY, id: 2 }],
          total: 7,
          totalPages: 4,
          page: 2,
          pageSize: 2,
        },
      }),
    );

    const result = await fetchGalleryList(
      { page: 2, pageSize: 2 },
      { fetch: fetchImpl },
    );

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(7);
    expect(result.total).not.toBe(result.data.length);
    expect(result.totalPages).toBe(4);
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

  it('throws a database fault as an ApiErrorException', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常' }),
    );

    await expect(
      fetchGalleryDetail({ id: '999' }, { fetch: fetchImpl }),
    ).rejects.toMatchObject({
      name: 'ApiErrorException',
      apiError: { _tag: 'DatabaseError', message: '数据库异常' },
    });
  });

  it('throws a not-found ApiError for the missing-album envelope the backend actually sends, which carries no data', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0007', message: '相册不存在' }),
    );

    await expect(
      fetchGalleryDetail({ id: '999' }, { fetch: fetchImpl }),
    ).rejects.toMatchObject({
      name: 'ApiErrorException',
      apiError: { _tag: 'NotFound', message: '相册不存在' },
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

  it('rejects a photo carrying only the bare object key, so no gallery page can render an unresolvable src', async () => {
    const { signedUrl: _omitted, ...bareKeyPhoto } = PHOTO;
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          ...GALLERY,
          cover: bareKeyPhoto,
          photos: [bareKeyPhoto],
        },
      }),
    );

    await expect(
      fetchGalleryDetail({ id: '1' }, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('rejects a 200 success envelope whose data is null, because a missing album is no longer a null payload', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: '0000', message: 'success', data: null }),
    );

    await expect(
      fetchGalleryDetail({ id: '999' }, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('still throws ResponseValidationError for a malformed album', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { id: '1', name: 'Album 1' },
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
