/*
 * The loader prefetches
 * `articleDetailQueryOptions({ id: articleId })` so the detail page
 * can `useSuspenseQuery` from a warm cache slot. An invalid
 * `articleId` (non-numeric) throws so the route's error boundary
 * can take over without ever calling the backend.
 *
 * The detail schema deliberately omits `content` (the backend's
 * SELECT for `/cms/articles/detail` does not project that
 * column). The page is metadata-only; the editor is the canonical
 * place to edit the body.
 */

import { createFileRoute } from '@tanstack/react-router';

import { safeNumber } from '@zcat/ui';
import type { QueryClient } from '@tanstack/react-query';

import { ArticleDetailPage } from '@cms/features/article/components/article/article-detail';
import { articleDetailQueryOptions } from '@cms/server/articles';

/**
 * Pure loader logic — extracted so it can be unit-tested without
 * booting the TanStack Start runtime (the `createServerFn`
 * boundary requires the AsyncLocalStorage Start context).
 */
export async function ensureArticleDetailQueries({
  params,
  context,
}: {
  params: { articleId?: string };
  context: { queryClient: QueryClient };
}): Promise<unknown> {
  const articleId = safeNumber(params.articleId);
  if (Number.isNaN(articleId)) {
    throw new Error('Invalid article id');
  }
  return context.queryClient.query({
    ...articleDetailQueryOptions({ id: articleId }),
    staleTime: 'static',
  });
}

export const Route = createFileRoute('/_cms/articles_/$articleId')({
  loader: ({ context, params }) =>
    ensureArticleDetailQueries({ params, context }),
  component: ArticleDetailRoute,
});

function ArticleDetailRoute() {
  const { articleId } = Route.useParams() as { articleId: string };
  const numericId = Number(articleId);
  return <ArticleDetailPage articleId={numericId} />;
}
