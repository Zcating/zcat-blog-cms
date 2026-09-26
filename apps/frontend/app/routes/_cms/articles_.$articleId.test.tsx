/**
 * Tests for the `_cms/articles/$articleId` route file.
 *
 * Scope:
 *   - The loader reads `articleId` from `params.articleId` and ensures
 *     `articleDetailQueryOptions({ id })` is hydrated into the Query
 *     cache.
 *   - Invalid `articleId` (non-numeric) throws so the route's error
 *     boundary can take over.
 *
 * The test exercises the pure `ensureArticleDetailQueries` helper
 * directly so it does NOT boot the TanStack Start runtime (the
 * `createServerFn` boundary requires the AsyncLocalStorage Start
 * context that does not exist in vitest).
 *
 * The only mocked boundary is the server-function surface
 * (`@cms/server/articles`); the `QueryClient` is exercised as-is.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleMock, queryMock } = vi.hoisted(() => ({
  getArticleMock: vi.fn(),
  queryMock: vi.fn(),
}));

vi.mock('@cms/server/articles', async () => {
  const actual = await vi.importActual<typeof import('@cms/server/articles')>(
    '@cms/server/articles',
  );
  return {
    ...actual,
    getArticle: (...args: unknown[]) => getArticleMock(...args),
  };
});

// --- import after mocks ---

import { ensureArticleDetailQueries } from './articles_.$articleId';

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.query = queryMock.mockResolvedValue(
    undefined,
  ) as typeof queryClient.query;
  return queryClient;
}

describe('route loader: /_cms/articles/$articleId', () => {
  beforeEach(() => {
    getArticleMock.mockReset();
    queryMock.mockReset();
  });

  it('ensures the article detail Query is hydrated', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleDetailQueries({
      params: { articleId: '7' },
      context: { queryClient },
    });

    expect(queryMock).toHaveBeenCalled();
    const calls = queryMock.mock.calls.map((c) => c[0]);
    const detailCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'articles' &&
        c.queryKey[1] === 'detail',
    );
    expect(detailCall).toBeDefined();
    expect(detailCall?.queryKey).toEqual(['articles', 'detail', 7]);
    expect(detailCall?.staleTime).toBe('static');
  });

  it('throws when articleId is not numeric', async () => {
    const queryClient = makeQueryClient();

    await expect(
      ensureArticleDetailQueries({
        params: { articleId: 'not-a-number' },
        context: { queryClient },
      }),
    ).rejects.toThrow('Invalid article id');
    expect(queryMock).not.toHaveBeenCalled();
  });
});
