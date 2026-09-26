import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { BackendUrlMissingError } from '@blog/server/env';
import { ApiErrorException } from '@blog/server/errors';
import { ResponseValidationError } from '@blog/server/result';

import { fetchArticleDetail, fetchArticleList } from './article-helpers';
import { getArticleDetail, getArticleList } from './index';
import { GetArticleListInputSchema } from './schemas';

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

const ARTICLE = {
  id: 1,
  title: 'Hello',
  excerpt: 'World',
  content: '# Hello',
  createByUserId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  publishAt: '2024-01-03T00:00:00.000Z',
  articleAndArticleTags: [
    {
      articleId: 1,
      articleTagId: 2,
      articleTag: { id: 2, name: 'react' },
    },
  ],
};

const ARTICLE_DETAIL = {
  id: 1,
  title: 'Hello',
  excerpt: 'World',
  content: '# Hello',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  publishAt: '2024-01-03T00:00:00.000Z',
  articleAndArticleTags: [{ articleId: 1, articleTagId: 2 }],
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

describe('fetchArticleList', () => {
  it('GETs the list endpoint and unwraps the envelope', async () => {
    let capturedUrl = '';
    let capturedMethod: string | undefined;
    const fetchImpl = makeFetch((input, init) => {
      capturedUrl = String(input);
      capturedMethod = init?.method;
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [ARTICLE], totalPages: 3, page: 1, pageSize: 10 },
      });
    });

    const result = await fetchArticleList(
      { page: 1, pageSize: 10, order: 'latest' },
      { fetch: fetchImpl },
    );

    expect(result.data[0]?.title).toBe('Hello');
    expect(result.totalPages).toBe(3);
    expect(capturedMethod).toBe('GET');
    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/article/list?page=1&pageSize=10&order=latest',
    );
  });

  it('applies the input defaults when called with no arguments', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], totalPages: 0, page: 1, pageSize: 10 },
      });
    });

    await fetchArticleList(undefined, { fetch: fetchImpl });

    expect(capturedUrl).toBe(
      'http://backend.local/api/blog/article/list?page=1&pageSize=10&order=latest',
    );
  });

  it('forwards the order parameter', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], totalPages: 1, page: 2, pageSize: 5 },
      });
    });

    await fetchArticleList(
      { page: 2, pageSize: 5, order: 'oldest' },
      { fetch: fetchImpl },
    );

    expect(capturedUrl).toContain('order=oldest');
    expect(capturedUrl).toContain('page=2');
  });

  it('throws ApiErrorException when the backend returns a failure code', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '数据库异常', data: null }),
    );

    await expect(
      fetchArticleList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ApiErrorException);
  });

  it('throws ResponseValidationError when the data payload does not match', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [{ id: 'oops' }], totalPages: 1, page: 1, pageSize: 10 },
      }),
    );

    await expect(
      fetchArticleList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(ResponseValidationError);
  });

  it('throws BackendUrlMissingError when BACKEND_API_URL is absent', async () => {
    delete process.env.BACKEND_API_URL;
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchArticleList(undefined, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(BackendUrlMissingError);
  });

  it('rejects an invalid order before issuing a request', async () => {
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchArticleList(
        { page: 1, pageSize: 10, order: 'sideways' as never },
        { fetch: fetchImpl },
      ),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('issues exactly one fetch call (no retries)', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: { data: [], totalPages: 0, page: 1, pageSize: 10 },
      }),
    );

    await fetchArticleList(undefined, { fetch: fetchImpl });

    expect(
      (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls,
    ).toHaveLength(1);
  });
});

describe('fetchArticleDetail', () => {
  it('GETs the detail endpoint with the article id', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({
        code: '0000',
        message: 'success',
        data: ARTICLE_DETAIL,
      });
    });

    const result = await fetchArticleDetail({ id: '1' }, { fetch: fetchImpl });

    expect(result.title).toBe('Hello');
    expect(result.content).toBe('# Hello');
    expect(capturedUrl).toBe('http://backend.local/api/blog/article/1');
  });

  it('throws ApiErrorException with the backend message when the article is missing', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0003', message: '文章不存在' }),
    );

    await expect(
      fetchArticleDetail({ id: '999' }, { fetch: fetchImpl }),
    ).rejects.toMatchObject({
      name: 'ApiErrorException',
      message: '文章不存在',
      apiError: { _tag: 'DatabaseError', message: '文章不存在' },
    });
  });

  it('rejects a path-traversing id before issuing a request', async () => {
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      fetchArticleDetail({ id: '../../admin' }, { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(z.ZodError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('tolerates a detail payload without the tag join array', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({
        code: '0000',
        message: 'success',
        data: {
          id: 1,
          title: 'Hello',
          excerpt: 'World',
          content: '# Hello',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
          publishAt: '2024-01-03T00:00:00.000Z',
        },
      }),
    );

    const result = await fetchArticleDetail({ id: '1' }, { fetch: fetchImpl });

    expect(result.articleAndArticleTags).toEqual([]);
  });
});

describe('article server function wiring', () => {
  it('exposes GET server functions', () => {
    expect(getArticleList.method).toBe('GET');
    expect(getArticleDetail.method).toBe('GET');
    expect(typeof getArticleList.__executeServer).toBe('function');
    expect(typeof getArticleDetail.__executeServer).toBe('function');
  });

  it('validates list input with the same defaults the helper uses', () => {
    expect(GetArticleListInputSchema.parse({})).toEqual({
      page: 1,
      pageSize: 10,
      order: 'latest',
    });
  });
});
