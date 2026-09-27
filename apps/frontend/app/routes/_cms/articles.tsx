// The page MUST read a warm cache slot, so the loader hydrates both the
// article list and the tag list before the page mounts.

import { createFileRoute } from '@tanstack/react-router';

import type { QueryClient } from '@tanstack/react-query';

import { ArticleListPage } from '@cms/features/article/components/article/article-list';
import { paginationSearchSchema } from '@cms/shared/hooks/use-pagination-action';
import type { PaginationSearch } from '@cms/shared/hooks/use-pagination-action';
import { articlesListQueryOptions } from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

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
