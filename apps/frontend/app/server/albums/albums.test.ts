/*
 * The shared `fetch` boundary is the only seam that gets mocked.
 * Helpers from `@cms/server` (transport, env, cookies, middleware)
 * are exercised as-is so the tests do not invent a parallel
 * infrastructure.
 *
 * These tests intentionally do NOT exercise the RPC boundary. The
 * `createServerFn` wrapper adds TanStack Start's middleware/validator
 * on top of the helpers; middleware is covered separately by
 * `auth-middleware.test.ts` and validators are exercised via the
 * helpers' own schema parse.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieIO } from '../cookies';
import {
  addPhotos as addPhotosHelper,
  createPhotoAlbum as createPhotoAlbumHelper,
  deletePhotoAlbum as deletePhotoAlbumHelper,
  fetchPhotoAlbum as fetchPhotoAlbumHelper,
  fetchPhotoAlbums as fetchPhotoAlbumsHelper,
  setPhotoAlbumCover as setPhotoAlbumCoverHelper,
  updatePhotoAlbum as updatePhotoAlbumHelper,
} from './albums-helpers';
import {
  AddPhotosInputSchema,
  CreatePhotoAlbumInputSchema,
  GetPhotoAlbumsInputSchema,
  PaginatedPhotoAlbumsSchema,
  PhotoAlbumCoverSchema,
  PhotoAlbumDetailSchema,
  PhotoAlbumSchema,
  SetPhotoAlbumCoverInputSchema,
  UpdatePhotoAlbumInputSchema,
} from './schemas';

function makeCookieIo(cookieValue: string | undefined): CookieIO {
  return {
    getCookie: vi.fn(() => cookieValue),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  };
}

function makeFetch(
  responder: (input: RequestInfo | URL, init?: RequestInit) => Response,
): typeof fetch {
  return vi.fn(responder) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as Response;
}

const VALID_AUTHORIZATION_COOKIE = 'Bearer test.jwt.value';
const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;

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

describe('PhotoAlbumCoverSchema', () => {
  it('parses a cover photo payload', () => {
    const parsed = PhotoAlbumCoverSchema.parse({
      id: 11,
      name: 'cover.jpg',
      url: 'photos/cover.jpg',
      thumbnailUrl: 'photos/cover.thumbnail.jpg',
      signedUrl: 'https://signed.example/photos/cover.jpg',
      signedThumbnailUrl: 'https://signed.example/photos/cover.thumbnail.jpg',
      albumId: 3,
      isCover: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(parsed.id).toBe(11);
    expect(parsed.isCover).toBe(true);
  });

  it('rejects a payload missing the id', () => {
    const result = PhotoAlbumCoverSchema.safeParse({
      name: 'p',
      url: 'u',
      thumbnailUrl: 't',
    });
    expect(result.success).toBe(false);
  });
});

describe('PhotoAlbumSchema (list item)', () => {
  it('parses a list-shape album payload', () => {
    const parsed = PhotoAlbumSchema.parse({
      id: 1,
      name: 'travel',
      description: 'trip photos',
      coverId: 11,
      available: true,
      cover: {
        id: 11,
        name: 'cover.jpg',
        url: 'photos/cover.jpg',
        thumbnailUrl: 'photos/cover.thumbnail.jpg',
        signedUrl: 'https://signed.example/photos/cover.jpg',
        signedThumbnailUrl: 'https://signed.example/photos/cover.thumbnail.jpg',
        albumId: 1,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(parsed.id).toBe(1);
    expect(parsed.cover?.id).toBe(11);
  });

  it('accepts null cover and undefined coverId', () => {
    const parsed = PhotoAlbumSchema.parse({
      id: 2,
      name: 'empty',
      description: '',
      coverId: null,
      available: false,
      cover: null,
    });
    expect(parsed.cover).toBeNull();
    expect(parsed.coverId).toBeNull();
  });
});

describe('PhotoAlbumDetailSchema', () => {
  it('parses a detail-shape album payload (coverId, no cover)', () => {
    const parsed = PhotoAlbumDetailSchema.parse({
      id: 7,
      name: 'detail',
      description: 'desc',
      coverId: 12,
      available: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(parsed.coverId).toBe(12);
  });
});

describe('PaginatedPhotoAlbumsSchema', () => {
  it('parses the paginated envelope', () => {
    const parsed = PaginatedPhotoAlbumsSchema.parse({
      data: [],
      page: 1,
      pageSize: 10,
      totalPages: 0,
      total: 0,
    });
    expect(parsed.totalPages).toBe(0);
  });

  it('tolerates backend payloads without the total field', () => {
    const parsed = PaginatedPhotoAlbumsSchema.parse({
      data: [],
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
    expect(parsed.total).toBeUndefined();
  });

  it('rejects an envelope missing the data array', () => {
    const result = PaginatedPhotoAlbumsSchema.safeParse({
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('CreatePhotoAlbumInputSchema', () => {
  it('requires a non-empty name', () => {
    const ok = CreatePhotoAlbumInputSchema.safeParse({
      name: 'trip',
      description: '',
      available: true,
    });
    const bad = CreatePhotoAlbumInputSchema.safeParse({
      name: '',
      description: '',
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('defaults optional fields', () => {
    const parsed = CreatePhotoAlbumInputSchema.parse({ name: 'a' });
    expect(parsed.description).toBe('');
    expect(parsed.available).toBe(false);
  });
});

describe('UpdatePhotoAlbumInputSchema', () => {
  it('requires the album id', () => {
    const ok = UpdatePhotoAlbumInputSchema.safeParse({
      id: 1,
      name: 'updated',
    });
    const bad = UpdatePhotoAlbumInputSchema.safeParse({ name: 'updated' });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('keeps omitted fields undefined so the backend treats them as no-op', () => {
    const parsed = UpdatePhotoAlbumInputSchema.parse({ id: 1 });
    expect(parsed.name).toBeUndefined();
    expect(parsed.description).toBeUndefined();
    expect(parsed.available).toBeUndefined();
  });
});

describe('SetPhotoAlbumCoverInputSchema', () => {
  it('requires both albumId and photoId', () => {
    const ok = SetPhotoAlbumCoverInputSchema.safeParse({
      albumId: 1,
      photoId: 2,
    });
    const bad = SetPhotoAlbumCoverInputSchema.safeParse({ albumId: 1 });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('AddPhotosInputSchema', () => {
  it('requires albumId and a non-empty photoIds array', () => {
    const ok = AddPhotosInputSchema.safeParse({
      albumId: 1,
      photoIds: [1, 2, 3],
    });
    const bad = AddPhotosInputSchema.safeParse({ albumId: 1, photoIds: [] });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('GetPhotoAlbumsInputSchema', () => {
  it('defaults page=1, pageSize=10', () => {
    const parsed = GetPhotoAlbumsInputSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });
});

describe('fetchPhotoAlbums', () => {
  it('GETs the backend paginated list and unwraps the envelope', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [
            {
              id: 1,
              name: 'a',
              description: '',
              coverId: null,
              available: false,
              cover: null,
            },
          ],
          totalPages: 1,
          page: 1,
          pageSize: 10,
          total: 1,
        },
      });
    });

    const result = await fetchPhotoAlbumsHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(result.data[0]?.id).toBe(1);
    expect(result.totalPages).toBe(1);
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toContain('/cms/photo-albums');
    // Default page=1, pageSize=10 is forwarded as a query string so
    // the backend always sees an explicit pagination contract.
    expect(capturedUrl).toContain('page=1');
    expect(capturedUrl).toContain('pageSize=10');
  });

  it('forwards page / pageSize as query string', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [],
          totalPages: 0,
          page: 2,
          pageSize: 25,
          total: 0,
        },
      });
    });

    await fetchPhotoAlbumsHelper(
      { page: 2, pageSize: 25 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toContain('/cms/photo-albums');
    expect(capturedUrl).toContain('page=2');
    expect(capturedUrl).toContain('pageSize=25');
  });

  it('forwards the session Cookie as Authorization', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [],
          totalPages: 0,
          page: 1,
          pageSize: 10,
          total: 0,
        },
      });
    });

    await fetchPhotoAlbumsHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(capturedHeaders?.Authorization).toBe(VALID_AUTHORIZATION_COOKIE);
  });

  it('throws a typed ApiError when the backend rejects the call', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常', data: null }),
    );

    await expect(
      fetchPhotoAlbumsHelper(undefined, {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({
      _tag: 'DatabaseError',
      message: '数据库异常',
    });
  });

  it('throws a typed ResponseValidationError when the data payload does not match the schema', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'ok',
        data: { data: [], page: 1, pageSize: 10, total: 0 },
      }),
    );

    await expect(
      fetchPhotoAlbumsHelper(undefined, {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });

  it('issues exactly one fetch call (no retries)', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [],
          totalPages: 0,
          page: 1,
          pageSize: 10,
          total: 0,
        },
      }),
    );

    await fetchPhotoAlbumsHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });
});

describe('fetchPhotoAlbum', () => {
  it('GETs the backend detail endpoint with the album id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 7,
          name: 'detail',
          description: 'desc',
          coverId: 12,
          available: true,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      });
    });

    const result = await fetchPhotoAlbumHelper(
      { id: 7 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(7);
    expect(capturedUrl).toBe('http://backend.local/api/cms/photo-albums/7');
  });

  it('rejects on a malformed payload', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'ok',
        data: { id: 'oops' },
      }),
    );

    await expect(
      fetchPhotoAlbumHelper(
        { id: 1 },
        {
          fetch: fetchImpl,
          cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
        },
      ),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

describe('createPhotoAlbum', () => {
  it('POSTs to /cms/photo-albums and unwraps the new album', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 11,
          name: 'New',
          description: '',
          coverId: null,
          available: false,
          cover: null,
        },
      });
    });

    const result = await createPhotoAlbumHelper(
      { name: 'New', description: '', available: false },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(11);
    expect(capturedUrl).toBe('http://backend.local/api/cms/photo-albums');
    expect(capturedBody).toEqual({
      name: 'New',
      description: '',
      available: false,
    });
  });
});

describe('updatePhotoAlbum', () => {
  it('POSTs to /cms/photo-albums/update with id + partial fields', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 7,
          name: 'Updated',
          description: 'desc',
          coverId: null,
          available: true,
          cover: null,
        },
      });
    });

    const result = await updatePhotoAlbumHelper(
      { id: 7, name: 'Updated' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.name).toBe('Updated');
    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/photo-albums/update',
    );
    // The legacy surface forwarded all four fields; we preserve that so
    // explicit `false` / empty-string patches are never lost.
    expect(capturedBody).toEqual({
      id: 7,
      name: 'Updated',
      description: undefined,
      available: undefined,
    });
  });
});

describe('deletePhotoAlbum', () => {
  it('POSTs to /cms/photo-albums/delete with the album id as a string', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await deletePhotoAlbumHelper(
      { id: 9 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/photo-albums/delete',
    );
    expect(capturedBody).toEqual({ id: '9' });
  });
});

describe('setPhotoAlbumCover', () => {
  it('POSTs to /cms/photo-albums/cover with albumId + photoId', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await setPhotoAlbumCoverHelper(
      { albumId: 1, photoId: 2 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe('http://backend.local/api/cms/photo-albums/cover');
    expect(capturedBody).toEqual({ albumId: 1, photoId: 2 });
  });
});

describe('addPhotos', () => {
  it('POSTs to /cms/photo-albums/add-photos with albumId + photoIds', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await addPhotosHelper(
      { albumId: 1, photoIds: [10, 11] },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/photo-albums/add-photos',
    );
    expect(capturedBody).toEqual({ albumId: 1, photoIds: [10, 11] });
  });
});
