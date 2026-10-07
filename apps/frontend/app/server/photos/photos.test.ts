/**
 * Contract tests for the photos domain server boundary.
 *
 * Scope:
 *   1. Zod schemas (input + output) accept and reject the right payloads.
 *   2. Core helpers unwrap Fastify envelopes, forward the session
 *      Cookie on protected operations, and surface typed `ApiError` /
 *      `ResponseValidationError` for failures.
 *   3. The shared `fetch` boundary is the only seam that gets mocked.
 *      Helpers from `@cms/server` (transport, env, cookies, middleware)
 *      are exercised as-is so the tests do not invent a parallel
 *      infrastructure.
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
  createAlbumPhoto as createAlbumPhotoHelper,
  createPhoto as createPhotoHelper,
  deletePhoto as deletePhotoHelper,
  fetchEmptyAlbumPhotos as fetchEmptyAlbumPhotosHelper,
  fetchPhoto as fetchPhotoHelper,
  fetchPhotos as fetchPhotosHelper,
  updateAlbumPhoto as updateAlbumPhotoHelper,
  updatePhoto as updatePhotoHelper,
} from './photos-helpers';
import {
  CreateAlbumPhotoInputSchema,
  CreatePhotoInputSchema,
  GetPhotosInputSchema,
  PaginatedPhotosSchema,
  PhotoSchema,
  UpdateAlbumPhotoInputSchema,
  UpdatePhotoInputSchema,
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

// ---------------------------------------------------------------------------
// Schema tests
// ---------------------------------------------------------------------------

describe('PhotoSchema', () => {
  it('parses a backend photo payload', () => {
    const parsed = PhotoSchema.parse({
      id: 1,
      name: 'p',
      url: 'photos/p.jpg',
      thumbnailUrl: 'photos/p.thumb.jpg',
      signedUrl: 'https://signed.example/photos/p.jpg',
      signedThumbnailUrl: 'https://signed.example/photos/p.thumb.jpg',
      albumId: 5,
      isCover: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(parsed.albumId).toBe(5);
  });

  it('accepts a null albumId (empty-album photo)', () => {
    const parsed = PhotoSchema.parse({
      id: 2,
      name: 'p2',
      url: 'u',
      thumbnailUrl: 't',
      signedUrl: 'https://signed.example/u',
      signedThumbnailUrl: 'https://signed.example/t',
      albumId: null,
    });
    expect(parsed.albumId).toBeNull();
  });

  it('rejects a payload missing the id', () => {
    const result = PhotoSchema.safeParse({
      name: 'p',
      url: 'u',
      thumbnailUrl: 't',
    });
    expect(result.success).toBe(false);
  });
});

describe('PaginatedPhotosSchema', () => {
  it('parses the paginated envelope', () => {
    const parsed = PaginatedPhotosSchema.parse({
      data: [
        {
          id: 1,
          name: 'p',
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
        },
      ],
      totalPages: 1,
      page: 1,
      pageSize: 20,
      total: 1,
    });
    expect(parsed.data[0]?.id).toBe(1);
  });

  it('tolerates backend payloads without the total field', () => {
    const parsed = PaginatedPhotosSchema.parse({
      data: [],
      totalPages: 0,
      page: 1,
      pageSize: 20,
    });
    expect(parsed.total).toBeUndefined();
  });

  it('rejects an envelope missing the data array', () => {
    const result = PaginatedPhotosSchema.safeParse({
      totalPages: 0,
      page: 1,
      pageSize: 20,
    });
    expect(result.success).toBe(false);
  });
});

describe('GetPhotosInputSchema', () => {
  it('defaults page=1, pageSize=20', () => {
    const parsed = GetPhotosInputSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(20);
  });

  it('coerces string-shaped pagination', () => {
    const parsed = GetPhotosInputSchema.parse({
      albumId: '5',
      page: '2',
      pageSize: '30',
    });
    expect(parsed.albumId).toBe(5);
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(30);
  });
});

describe('CreatePhotoInputSchema', () => {
  it('requires name + url + thumbnailUrl', () => {
    const ok = CreatePhotoInputSchema.safeParse({
      name: 'p',
      url: 'u',
      thumbnailUrl: 't',
    });
    const bad = CreatePhotoInputSchema.safeParse({ name: 'p' });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('CreateAlbumPhotoInputSchema', () => {
  it('requires albumId + name + url + thumbnailUrl', () => {
    const ok = CreateAlbumPhotoInputSchema.safeParse({
      albumId: 1,
      name: 'p',
      url: 'u',
      thumbnailUrl: 't',
    });
    const bad = CreateAlbumPhotoInputSchema.safeParse({
      albumId: 1,
      name: 'p',
      url: 'u',
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('UpdatePhotoInputSchema', () => {
  it('requires id and accepts partial fields', () => {
    const parsed = UpdatePhotoInputSchema.parse({
      id: 1,
      name: 'new',
    });
    expect(parsed.id).toBe(1);
    expect(parsed.name).toBe('new');
    expect(parsed.url).toBeUndefined();
  });
});

describe('UpdateAlbumPhotoInputSchema', () => {
  it('requires id, albumId, name, isCover (per backend contract)', () => {
    const ok = UpdateAlbumPhotoInputSchema.safeParse({
      id: 1,
      albumId: 2,
      name: 'p',
      isCover: false,
    });
    const bad = UpdateAlbumPhotoInputSchema.safeParse({
      id: 1,
      name: 'p',
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('coerces isCover from "true"/"false" strings (matches backend preprocess)', () => {
    const t = UpdateAlbumPhotoInputSchema.parse({
      id: 1,
      albumId: 2,
      name: 'p',
      isCover: 'true',
    });
    const f = UpdateAlbumPhotoInputSchema.parse({
      id: 1,
      albumId: 2,
      name: 'p',
      isCover: 'false',
    });
    expect(t.isCover).toBe(true);
    expect(f.isCover).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Server function tests — fetch boundary is the only mock.
// ---------------------------------------------------------------------------

describe('fetchPhotos', () => {
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
              name: 'p',
              url: 'u',
              thumbnailUrl: 't',
              signedUrl: 'https://signed.example/u',
              signedThumbnailUrl: 'https://signed.example/t',
              albumId: 5,
              isCover: false,
            },
          ],
          totalPages: 1,
          page: 1,
          pageSize: 20,
          total: 1,
        },
      });
    });

    const result = await fetchPhotosHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(result.data[0]?.id).toBe(1);
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toContain('/cms/photos');
  });

  it('forwards albumId / page / pageSize as query string', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [],
          totalPages: 0,
          page: 3,
          pageSize: 30,
          total: 0,
        },
      });
    });

    await fetchPhotosHelper(
      { albumId: 5, page: 3, pageSize: 30 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toContain('albumId=5');
    expect(capturedUrl).toContain('page=3');
    expect(capturedUrl).toContain('pageSize=30');
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
          pageSize: 20,
          total: 0,
        },
      });
    });

    await fetchPhotosHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(capturedHeaders?.Authorization).toBe(VALID_AUTHORIZATION_COOKIE);
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
          pageSize: 20,
          total: 0,
        },
      }),
    );

    await fetchPhotosHelper(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });

  it('throws a typed ApiError when the backend rejects the call', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常', data: null }),
    );

    await expect(
      fetchPhotosHelper(undefined, {
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
        data: { data: [], page: 1, pageSize: 20, total: 0 },
      }),
    );

    await expect(
      fetchPhotosHelper(undefined, {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

describe('fetchEmptyAlbumPhotos', () => {
  it('GETs /cms/photos/empty-album and unwraps the photo list', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: [
          {
            id: 7,
            name: 'orphan',
            url: 'photos/o.jpg',
            thumbnailUrl: 'photos/o.thumb.jpg',
            signedUrl: 'https://signed.example/photos/o.jpg',
            signedThumbnailUrl: 'https://signed.example/photos/o.thumb.jpg',
            albumId: null,
          },
        ],
      });
    });

    const result = await fetchEmptyAlbumPhotosHelper({
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toBe('http://backend.local/api/cms/photos/empty-album');
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe(7);
  });

  it('rejects on a malformed payload (object instead of array)', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'ok',
        data: { id: 1 },
      }),
    );

    await expect(
      fetchEmptyAlbumPhotosHelper({
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

describe('fetchPhoto', () => {
  it('GETs /cms/photos/detail with the photo id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 7,
          name: 'detail',
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
          albumId: 5,
          isCover: true,
        },
      });
    });

    const result = await fetchPhotoHelper(
      { id: 7 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(7);
    expect(capturedUrl).toBe('http://backend.local/api/cms/photos/detail?id=7');
  });
});

describe('createPhoto', () => {
  it('POSTs to /cms/photos/create with name + url + thumbnailUrl', async () => {
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
          name: 'p',
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
        },
      });
    });

    const result = await createPhotoHelper(
      { name: 'p', url: 'u', thumbnailUrl: 't' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(11);
    expect(capturedUrl).toBe('http://backend.local/api/cms/photos/create');
    expect(capturedBody).toEqual({ name: 'p', url: 'u', thumbnailUrl: 't' });
  });
});

describe('createAlbumPhoto', () => {
  it('POSTs to /cms/photos/create/with-album with albumId + name + urls', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 12,
          name: 'p',
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
          albumId: 3,
        },
      });
    });

    const result = await createAlbumPhotoHelper(
      { albumId: 3, name: 'p', url: 'u', thumbnailUrl: 't' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(12);
    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/photos/create/with-album',
    );
    expect(capturedBody).toEqual({
      albumId: 3,
      name: 'p',
      url: 'u',
      thumbnailUrl: 't',
    });
  });
});

describe('updatePhoto', () => {
  it('POSTs to /cms/photos/update with id + partial fields', async () => {
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
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
        },
      });
    });

    const result = await updatePhotoHelper(
      { id: 7, name: 'Updated' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.name).toBe('Updated');
    expect(capturedUrl).toBe('http://backend.local/api/cms/photos/update');
    expect(capturedBody).toEqual({ id: 7, name: 'Updated' });
  });
});

describe('updateAlbumPhoto', () => {
  it('POSTs to /cms/photos/update/with-album with albumId + isCover + name', async () => {
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
          name: 'p',
          url: 'u',
          thumbnailUrl: 't',
          signedUrl: 'https://signed.example/u',
          signedThumbnailUrl: 'https://signed.example/t',
          albumId: 2,
          isCover: false,
        },
      });
    });

    const result = await updateAlbumPhotoHelper(
      { id: 7, albumId: 2, name: 'p', isCover: false },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(7);
    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/photos/update/with-album',
    );
    expect(capturedBody).toEqual({
      id: 7,
      albumId: 2,
      name: 'p',
      isCover: false,
    });
  });
});

describe('deletePhoto', () => {
  it('POSTs to /cms/photos/delete with the photo id (number)', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await deletePhotoHelper(
      { id: 9 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe('http://backend.local/api/cms/photos/delete');
    expect(capturedBody).toEqual({ id: 9 });
  });

  it('resolves for the real void wire body, which omits the data key', async () => {
    // The backend's `ResultData<T>` types `data?: T`, so a void result is
    // serialised as a literal `{ code, message }` pair with no `data` key.
    // Verified against the running backend: DELETE /api/cms/photos/delete
    // answers 200 `{"code":"0000","message":"删除成功"}`. Round-tripped
    // through JSON so this is the exact bytes the transport receives.
    //
    // Before `data` became optional in `successEnvelopeSchema`, this threw
    // "Response envelope failed schema validation", which rejected the
    // mutation and ran the optimistic rollback — putting the row the
    // server had just deleted straight back into the cache. That is why
    // the card never disappeared even though the DELETE had succeeded.
    const fetchImpl = makeFetch(() =>
      jsonResponse(
        JSON.parse(JSON.stringify({ code: '0000', message: '删除成功' })),
      ),
    );

    await expect(
      deletePhotoHelper(
        { id: 9 },
        { fetch: fetchImpl, cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE) },
      ),
    ).resolves.toBeUndefined();
  });
});
