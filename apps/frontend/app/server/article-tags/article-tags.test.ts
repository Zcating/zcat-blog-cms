/**
 * Contract tests for the article-tags domain server boundary.
 *
 * Same rules as `articles/articles.test.ts`:
 *   1. Zod schemas accept and reject the right payloads.
 *   2. Core helpers hit the documented endpoints, forward the
 *      session Cookie, and surface typed `ApiError` /
 *      `ResponseValidationError` for failures.
 *   3. The only mock is the shared `fetch` boundary. Helpers from
 *      `@cms/server` are exercised as-is.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CookieIO } from '../cookies';
import {
  createArticleTag,
  deleteArticleTag,
  fetchArticleTag,
  listArticleTags,
  updateArticleTag,
} from './article-tags-helpers';
import {
  ArticleTagSchema,
  CreateArticleTagInputSchema,
  UpdateArticleTagInputSchema,
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

describe('ArticleTagSchema', () => {
  it('parses a tag payload from the backend', () => {
    const parsed = ArticleTagSchema.parse({
      id: 3,
      name: 'tag',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    });
    expect(parsed.id).toBe(3);
    expect(parsed.name).toBe('tag');
  });

  it('rejects a tag payload missing the name field', () => {
    const result = ArticleTagSchema.safeParse({ id: 3 });
    expect(result.success).toBe(false);
  });
});

describe('CreateArticleTagInputSchema', () => {
  it('requires a non-empty name', () => {
    const ok = CreateArticleTagInputSchema.safeParse({ name: 't' });
    const bad = CreateArticleTagInputSchema.safeParse({ name: '' });
    expect(ok.success).toBe(true);
    expect(bad.success).toBe(false);
  });
});

describe('UpdateArticleTagInputSchema', () => {
  it('requires id and accepts an optional name patch', () => {
    const parsed = UpdateArticleTagInputSchema.parse({
      id: 3,
      name: 'updated',
    });
    expect(parsed.id).toBe(3);
    expect(parsed.name).toBe('updated');
  });

  it('rejects an empty payload (id is required)', () => {
    const result = UpdateArticleTagInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Core helper tests
// ---------------------------------------------------------------------------

describe('listArticleTags', () => {
  it('GETs the article-tags list and unwraps the envelope', async () => {
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
            id: 1,
            name: 'a',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-02T00:00:00.000Z',
          },
          {
            id: 2,
            name: 'b',
            createdAt: '2024-01-03T00:00:00.000Z',
            updatedAt: '2024-01-04T00:00:00.000Z',
          },
        ],
      });
    });

    const result = await listArticleTags({
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(result).toHaveLength(2);
    expect(capturedUrl).toBe('http://backend.local/api/cms/article-tags');
    expect(capturedMethod).toBe('GET');
  });

  it('forwards the session Cookie as Authorization', async () => {
    let capturedHeaders: Record<string, string> | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedHeaders = init?.headers as Record<string, string>;
      return jsonResponse({ code: '0000', message: 'ok', data: [] });
    });

    await listArticleTags({
      fetch: fetchImpl,
      cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
    });

    expect(capturedHeaders?.Authorization).toBe(VALID_AUTHORIZATION_COOKIE);
  });

  it('throws a typed ApiError when the backend returns ERR0003', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常', data: null }),
    );

    await expect(
      listArticleTags({
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      }),
    ).rejects.toMatchObject({
      _tag: 'DatabaseError',
      message: '数据库异常',
    });
  });
});

describe('fetchArticleTag', () => {
  it('GETs the article-tag by id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 5,
          name: 'tag',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      });
    });

    const result = await fetchArticleTag(
      { id: 5 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(5);
    expect(capturedUrl).toBe('http://backend.local/api/cms/article-tags/5');
  });
});

describe('createArticleTag', () => {
  it('POSTs to /cms/article-tags with the new tag payload', async () => {
    let capturedUrl = '';
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 9,
          name: 'new',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      });
    });

    const result = await createArticleTag(
      { name: 'new' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.id).toBe(9);
    expect(capturedUrl).toBe('http://backend.local/api/cms/article-tags');
    expect(capturedBody).toEqual({ name: 'new' });
  });
});

describe('updateArticleTag', () => {
  it('PUTs to /cms/article-tags/:id with the partial patch', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    let capturedBody: unknown;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      capturedBody = JSON.parse(String(init?.body));
      return jsonResponse({
        code: '0000',
        message: 'ok',
        data: {
          id: 4,
          name: 'updated',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      });
    });

    const result = await updateArticleTag(
      { id: 4, name: 'updated' },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(result.name).toBe('updated');
    expect(capturedUrl).toBe('http://backend.local/api/cms/article-tags/4');
    expect(capturedMethod).toBe('PUT');
    expect(capturedBody).toEqual({ name: 'updated' });
  });
});

describe('deleteArticleTag', () => {
  it('DELETEs /cms/article-tags/:id with the session Cookie', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    let capturedHeaders: Record<string, string> | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      capturedHeaders = init?.headers as Record<string, string>;
      return jsonResponse({ code: '0000', message: 'ok', data: null });
    });

    await deleteArticleTag(
      { id: 8 },
      {
        fetch: fetchImpl,
        cookie: makeCookieIo(VALID_AUTHORIZATION_COOKIE),
      },
    );

    expect(capturedUrl).toBe('http://backend.local/api/cms/article-tags/8');
    expect(capturedMethod).toBe('DELETE');
    expect(capturedHeaders?.Authorization).toBe(VALID_AUTHORIZATION_COOKIE);
  });
});
