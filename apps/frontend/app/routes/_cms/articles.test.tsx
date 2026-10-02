/**
 * Tests for the `_cms/articles` route file.
 *
 * Scope:
 *   - The loader reads `page` and `pageSize` from the URL search
 *     params (defaulting to 1 / 10).
 *   - The loader calls
 *     `context.queryClient.query({ ...articlesListQueryOptions(...), staleTime: 'static' })`
 *     so SSR has a hydrated cache slot before the page reads it.
 *   - The loader also ensures the article-tags list Query is warm
 *     so the in-page tag manager can render without a second
 *     round-trip.
 *
 * The test exercises the pure `ensureArticleListQueries` helper
 * directly so it does NOT boot the TanStack Start runtime (the
 * `createServerFn` boundary requires the AsyncLocalStorage Start
 * context that does not exist in vitest).
 *
 * The only mocked boundary is the server-function surface
 * (`@cms/server/articles`, `@cms/server/article-tags`); the
 * `QueryClient` and helper are exercised as-is.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticlesMock, listArticleTagsMock, queryMock } = vi.hoisted(() => ({
  getArticlesMock: vi.fn(),
  listArticleTagsMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock('@cms/server/articles', async () => {
  const actual = await vi.importActual<typeof import('@cms/server/articles')>(
    '@cms/server/articles',
  );
  return {
    ...actual,
    getArticles: (...args: unknown[]) => getArticlesMock(...args),
  };
});

vi.mock('@cms/server/article-tags', async () => {
  const actual = await vi.importActual<
    typeof import('@cms/server/article-tags')
  >('@cms/server/article-tags');
  return {
    ...actual,
    listArticleTagsServerFn: (...args: unknown[]) =>
      listArticleTagsMock(...args),
  };
});

// --- import after mocks ---

import { paginationSearchSchema } from '@cms/shared/hooks/use-pagination-action';
import { ensureArticleListQueries, Route } from './articles';

describe('route search schema: /_cms/articles', () => {
  it('registers the shared pagination search schema', () => {
    expect(Route.options.validateSearch).toBe(paginationSearchSchema);
  });
});

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.query = queryMock.mockResolvedValue(
    undefined,
  ) as typeof queryClient.query;
  return queryClient;
}

describe('route loader: /_cms/articles', () => {
  beforeEach(() => {
    getArticlesMock.mockReset();
    listArticleTagsMock.mockReset();
    queryMock.mockReset();
  });

  it('ensures the paginated articles Query with default (page=1, pageSize=10)', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleListQueries({ search: {}, context: { queryClient } });

    expect(queryMock).toHaveBeenCalled();
    const calls = queryMock.mock.calls.map((c) => c[0]);
    const listCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'articles' &&
        c.queryKey[1] === 'list',
    );
    expect(listCall).toBeDefined();
    expect(listCall?.queryKey).toEqual([
      'articles',
      'list',
      { page: 1, pageSize: 10 },
    ]);
    expect(listCall?.staleTime).toBe('static');
  });

  it('honors explicit page and pageSize from the URL search params', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleListQueries({
      search: paginationSearchSchema.parse({ page: '2', pageSize: '25' }),
      context: { queryClient },
    });

    const calls = queryMock.mock.calls.map((c) => c[0]);
    const listCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'articles' &&
        c.queryKey[1] === 'list',
    );
    expect(listCall?.queryKey).toEqual([
      'articles',
      'list',
      { page: 2, pageSize: 25 },
    ]);
  });

  it('also ensures the article-tags list Query', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleListQueries({ search: {}, context: { queryClient } });

    const calls = queryMock.mock.calls.map((c) => c[0]);
    const tagsCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'article-tags' &&
        c.queryKey[1] === 'list',
    );
    expect(tagsCall).toBeDefined();
  });
});
