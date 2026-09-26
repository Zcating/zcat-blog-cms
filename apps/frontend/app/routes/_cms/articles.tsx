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

import { safeNumber } from '@zcat/ui';
import type { QueryClient } from '@tanstack/react-query';

import { ArticleListPage } from '@cms/features/article/components/article/article-list';
import { articlesListQueryOptions } from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

/**
 * Pure loader logic — extracted so it can be unit-tested without
 * booting the TanStack Start runtime (the `createServerFn`
 * boundary requires the AsyncLocalStorage Start context).
 */
export async function ensureArticleListQueries({
  search,
  context,
}: {
  search: Record<string, unknown>;
  context: { queryClient: QueryClient };
}): Promise<unknown[]> {
  const { queryClient } = context;
  // `safeNumber` returns `NaN` for a missing key (the well-known
  // `parseFloat(undefined) === NaN` footgun); we coerce to a sane
  // integer before forwarding to the schema-parsing
  // `articlesListQueryOptions` factory.
  const page = safeNumber(search.page, 1) || 1;
  const pageSize = safeNumber(search.pageSize, 10) || 10;

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
  loader: ({ context, location }) =>
    ensureArticleListQueries({ search: location.search, context }),
  component: ArticleListRoute,
});

function ArticleListRoute() {
  const search = Route.useSearch() as { page?: number; pageSize?: number };
  const page = search.page ?? 1;
  const pageSize = search.pageSize ?? 10;

  return <ArticleListPage page={page} pageSize={pageSize} search={search} />;
}
