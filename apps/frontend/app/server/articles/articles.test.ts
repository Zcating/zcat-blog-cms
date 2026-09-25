/**
 * Contract tests for the articles domain server boundary.
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
  createArticle,
  deleteArticle,
  fetchArticle,
  fetchArticles,
  fetchArticleUploadImages,
  updateArticle,
} from './articles-helpers';
import {
  ArticleSchema,
  CreateArticleInputSchema,
  GetArticlesInputSchema,
  UpdateArticleInputSchema,
  UploadArticleImagesInputSchema,
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

describe('ArticleSchema', () => {
  it('parses a full article payload from the backend SELECT', () => {
    const parsed = ArticleSchema.parse({
      id: 1,
      title: 'Title',
      excerpt: 'Excerpt',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
      createByUserId: 7,
      publishAt: '2024-01-03T00:00:00.000Z',
    });
    expect(parsed.id).toBe(1);
    expect(parsed.title).toBe('Title');
  });

  it('rejects a payload missing the article id', () => {
    const result = ArticleSchema.safeParse({
      title: 't',
      excerpt: 'e',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      publishAt: '2024-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });
});

describe('GetArticlesInputSchema', () => {
  it('accepts a full pagination payload', () => {
    const parsed = GetArticlesInputSchema.parse({ page: 1, pageSize: 10 });
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });

  it('defaults missing pagination fields (page=1, pageSize=10)', () => {
    const parsed = GetArticlesInputSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(10);
  });

  it('coerces string-shaped pagination fields to numbers', () => {
    const parsed = GetArticlesInputSchema.parse({
      page: '2',
      pageSize: '20',
    });
    expect(parsed.page).toBe(2);
    expect(parsed.pageSize).toBe(20);
  });
});

describe('CreateArticleInputSchema', () => {
  it('requires title / excerpt / content', () => {
    const ok = CreateArticleInputSchema.safeParse({
      title: 't',
      excerpt: 'e',
      content: 'c',
    });
    const bad = CreateArticleInputSchema.safeParse({
      title: '',
      excerpt: 'e',
      content: 'c',
    });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });

  it('accepts an optional publishAt + tagIds payload', () => {
    const parsed = CreateArticleInputSchema.parse({
      title: 't',
      excerpt: 'e',
      content: 'c',
      publishAt: '2024-01-01T00:00:00.000Z',
      tagIds: [1, 2],
    });
    expect(parsed.tagIds).toEqual([1, 2]);
  });
});

describe('UpdateArticleInputSchema', () => {
  it('requires id and accepts partial fields', () => {
    const parsed = UpdateArticleInputSchema.parse({
      id: 1,
      title: 'new',
    });
    expect(parsed.id).toBe(1);
    expect(parsed.title).toBe('new');
    expect(parsed.excerpt).toBeUndefined();
  });

  it('rejects an empty payload (id is required)', () => {
    const result = UpdateArticleInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('UploadArticleImagesInputSchema', () => {
  it('requires an images array', () => {
    const parsed = UploadArticleImagesInputSchema.parse({
      images: ['base64-a', 'base64-b'],
    });
    expect(parsed.images).toEqual(['base64-a', 'base64-b']);
  });
});

// ---------------------------------------------------------------------------
// Core helper tests — fetch boundary is the only mock.
// ---------------------------------------------------------------------------

describe('fetchArticles', () => {
  it('GETs the backend paginated list and unwraps the envelope', async () => {
    const fetchImpl = makeFetch((input, init) => {
      const url = String(input);
      expect(url).toContain('/cms/articles');
      expect(init?.method).toBe('GET');
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          data: [
            {
              id: 1,
              title: 'A',
              excerpt: 'E',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-02T00:00:00.000Z',
              createByUserId: 1,
              publishAt: '2024-01-03T00:00:00.000Z',
            },
          ],
          totalPages: 1,
          page: 1,
          pageSize: 10,
          total: 1,
        },
      });
    });

    const result = await fetchArticles(undefined, {
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(result.total).toBe(1);
    expect(result.data[0]?.id).toBe(1);
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

    await fetchArticles(
      { page: 2, pageSize: 25 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toContain('/cms/articles');
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
        data: { data: [], totalPages: 0, page: 1, pageSize: 10, total: 0 },
      });
    });

    await fetchArticles(undefined, {
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
      fetchArticles(undefined, {
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
        // totalPages missing -> schema mismatch
        data: { data: [], page: 1, pageSize: 10, total: 0 },
      }),
    );

    await expect(
      fetchArticles(undefined, {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({ name: 'ResponseValidationError' });
  });
});

describe('fetchArticle', () => {
  it('GETs the backend detail endpoint with the article id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 7,
          title: 'A',
          excerpt: 'E',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          createByUserId: 1,
          publishAt: '2024-01-03T00:00:00.000Z',
        },
      });
    });

    const result = await fetchArticle(
      { id: 7 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(7);
    expect(capturedUrl).toContain('/cms/articles/detail');
    expect(capturedUrl).toContain('id=7');
  });
});

describe('createArticle', () => {
  it('POSTs to /cms/articles/create and unwraps the new article', async () => {
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
          title: 'New',
          excerpt: 'Exc',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          createByUserId: 1,
          publishAt: '2024-01-03T00:00:00.000Z',
        },
      });
    });

    const result = await createArticle(
      { title: 'New', excerpt: 'Exc', content: 'Body' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(11);
    expect(capturedUrl).toBe('http://backend.local/api/cms/articles/create');
    expect(capturedBody).toEqual({
      title: 'New',
      excerpt: 'Exc',
      content: 'Body',
    });
  });
});

describe('updateArticle', () => {
  it('POSTs to /cms/articles/update with id + partial fields', async () => {
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
          title: 'Updated',
          excerpt: 'E',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          createByUserId: 1,
          publishAt: '2024-01-03T00:00:00.000Z',
        },
      });
    });

    const result = await updateArticle(
      { id: 7, title: 'Updated' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.title).toBe('Updated');
    expect(capturedUrl).toBe('http://backend.local/api/cms/articles/update');
    expect(capturedBody).toEqual({ id: 7, title: 'Updated' });
  });
});

describe('deleteArticle', () => {
  it('POSTs to /cms/articles/delete with the article id', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await deleteArticle(
      { id: 9 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe('http://backend.local/api/cms/articles/delete');
    expect(capturedBody).toEqual({ id: 9 });
  });
});

describe('fetchArticleUploadImages', () => {
  it('POSTs to /cms/articles/upload-images and returns the URL list', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: ['url-a', 'url-b'],
      });
    });

    const result = await fetchArticleUploadImages(
      { images: ['base64-a', 'base64-b'] },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result).toEqual(['url-a', 'url-b']);
    expect(capturedUrl).toBe(
      'http://backend.local/api/cms/articles/upload-images',
    );
    expect(capturedBody).toEqual({ images: ['base64-a', 'base64-b'] });
  });
});
