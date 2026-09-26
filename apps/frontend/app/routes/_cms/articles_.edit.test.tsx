/**
 * Tests for the `_cms/articles/edit` route file.
 *
 * Scope:
 *   - The loader reads `id` from the URL search params (optional).
 *   - If `id` is present and parseable, the loader hydrates
 *     `articleDetailQueryOptions({ id })` so the editor form can
 *     prefill from the Query cache.
 *   - If `id` is absent or non-numeric, the loader is a no-op
 *     for the detail slot — the editor renders a blank form.
 *   - The tag list Query is always warmed up so the editor's
 *     tag selector can render.
 *
 * The test exercises the pure `ensureArticleEditQueries` helper
 * directly so it does NOT boot the TanStack Start runtime (the
 * `createServerFn` boundary requires the AsyncLocalStorage Start
 * context that does not exist in vitest).
 *
 * The only mocked boundary is the server-function surface
 * (`@cms/server/articles`, `@cms/server/article-tags`); the
 * `QueryClient` is exercised as-is.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleMock, listArticleTagsMock, queryMock } = vi.hoisted(() => ({
  getArticleMock: vi.fn(),
  listArticleTagsMock: vi.fn(),
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

import { ensureArticleEditQueries } from './articles_.edit';

function makeQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.query = queryMock.mockResolvedValue(
    undefined,
  ) as typeof queryClient.query;
  return queryClient;
}

describe('route loader: /_cms/articles/edit', () => {
  beforeEach(() => {
    getArticleMock.mockReset();
    listArticleTagsMock.mockReset();
    queryMock.mockReset();
  });

  it('hydrates the article detail Query when id is provided', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleEditQueries({
      search: { id: '7' },
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
    const tagsCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'article-tags' &&
        c.queryKey[1] === 'list',
    );
    expect(detailCall).toBeDefined();
    expect(detailCall?.queryKey).toEqual(['articles', 'detail', 7]);
    expect(detailCall?.staleTime).toBe('static');
    expect(tagsCall).toBeDefined();
    expect(tagsCall?.staleTime).toBe('static');
  });

  it('skips the article detail Query when id is missing', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleEditQueries({ search: {}, context: { queryClient } });

    expect(queryMock).toHaveBeenCalled();
    const calls = queryMock.mock.calls.map((c) => c[0]);
    const detailCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'articles' &&
        c.queryKey[1] === 'detail',
    );
    const tagsCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'article-tags' &&
        c.queryKey[1] === 'list',
    );
    expect(detailCall).toBeUndefined();
    expect(tagsCall).toBeDefined();
  });

  it('skips the article detail Query when id is non-numeric', async () => {
    const queryClient = makeQueryClient();

    await ensureArticleEditQueries({
      search: { id: 'not-a-number' },
      context: { queryClient },
    });

    const calls = queryMock.mock.calls.map((c) => c[0]);
    const detailCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'articles' &&
        c.queryKey[1] === 'detail',
    );
    const tagsCall = calls.find(
      (c: { queryKey: readonly unknown[] }) =>
        Array.isArray(c.queryKey) &&
        c.queryKey[0] === 'article-tags' &&
        c.queryKey[1] === 'list',
    );
    expect(detailCall).toBeUndefined();
    expect(tagsCall).toBeDefined();
  });
});
