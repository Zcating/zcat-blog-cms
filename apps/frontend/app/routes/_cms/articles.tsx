/**
 * Thin route wrapper for `/articles` — the pathless `_cms` layout
 * supplies the auth guard and the Query client.
 *
 * The loader prefetches two Query slots via
 * `context.queryClient.query({ ...options, staleTime: 'static' })`
 * so the page can `useSuspenseQuery` from a warm cache:
 *
 *   1. `articlesListQueryOptions({ page, pageSize })` — the
 *      paginated article list (no `content` / `tags` columns per
 *      the backend SELECT).
 *   2. `articleTagsListQueryOptions()` — the full tag list, so
 *      the in-page tag manager renders without a second trip.
 *
 * `page` / `pageSize` come from the URL search params. Defaults
 * mirror the legacy list page (1 / 10). The page itself reads
 * from Query, not `useLoaderData` / `HttpClient`.
 */

import { createFileRoute } from '@tanstack/react-router';

import type { QueryClient } from '@tanstack/react-query';

import { ArticleListPage } from '@cms/features/article/components/article/article-list';
import { paginationSearchSchema } from '@cms/shared/hooks/use-pagination-action';
import type { PaginationSearch } from '@cms/shared/hooks/use-pagination-action';
import { articlesListQueryOptions } from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

/**
 * Pure loader logic — extracted so it can be unit-tested without
 * booting the TanStack Start runtime (the `createServerFn`
 * boundary requires the AsyncLocalStorage Start context).
 *
 * `search` is already validated by `paginationSearchSchema`, so
 * `page` / `pageSize` arrive as positive integers or `undefined`
 * and the documented 1 / 10 defaults are applied here.
 */
export async function ensureArticleListQueries({
  search,
  context,
}: {
  search: PaginationSearch;
  context: { queryClient: QueryClient };
}): Promise<unknown[]> {
  const { queryClient } = context;
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 10;

  return Promise.all([
    queryClient.query({
      ...articlesListQueryOptions({ page, pageSize }),
      staleTime: 'static',
    }),
    queryClient.query({
      ...articleTagsListQueryOptions(),
      staleTime: 'static',
    }),
  ]);
}

export const Route = createFileRoute('/_cms/articles')({
  validateSearch: paginationSearchSchema,
  loader: ({ context, location }) =>
    ensureArticleListQueries({ search: location.search, context }),
  component: ArticleListRoute,
});

function ArticleListRoute() {
  const search = Route.useSearch();
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 10;

  return <ArticleListPage page={page} pageSize={pageSize} search={search} />;
}
