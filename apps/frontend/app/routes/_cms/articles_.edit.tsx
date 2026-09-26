/*
 * Loader behaviour:
 *   - `id` is read from the URL search params (optional). When
 *     present and parseable, the loader hydrates
 *     `articleDetailQueryOptions({ id })` so the editor form can
 *     prefill the existing row.
 *   - When `id` is absent or non-numeric, the loader is a no-op
 *     for the detail slot — the editor renders a blank form.
 *   - The tag list Query is always warmed up so the editor's tag
 *     selector renders without a second round-trip.
 */

import { createFileRoute } from '@tanstack/react-router';

import { safeNumber } from '@zcat/ui';
import type { QueryClient } from '@tanstack/react-query';

import { ArticleEditorPage } from '@cms/features/article/components/article/article-editor';
import { articleDetailQueryOptions } from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

/**
 * Pure loader logic — extracted so it can be unit-tested without
 * booting the TanStack Start runtime (the `createServerFn`
 * boundary requires the AsyncLocalStorage Start context).
 */
export async function ensureArticleEditQueries({
  search,
  context,
}: {
  search: Record<string, unknown>;
  context: { queryClient: QueryClient };
}): Promise<unknown> {
  const { queryClient } = context;
  const id = safeNumber(search.id);

  const tagPromise = queryClient.query({
    ...articleTagsListQueryOptions(),
    staleTime: 'static',
  });

  if (Number.isNaN(id)) {
    return tagPromise;
  }

  return Promise.all([
    queryClient.query({
      ...articleDetailQueryOptions({ id }),
      staleTime: 'static',
    }),
    tagPromise,
  ]);
}

export const Route = createFileRoute('/_cms/articles_/edit')({
  loader: ({ context, location }) =>
    ensureArticleEditQueries({ search: location.search, context }),
  component: ArticleEditRoute,
});

function ArticleEditRoute() {
  const search = Route.useSearch() as { id?: number };
  const id = typeof search.id === 'number' ? search.id : undefined;
  return <ArticleEditorPage id={id} />;
}
