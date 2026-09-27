// The detail schema omits `content`: the backend's SELECT for
// `/cms/articles/detail` does not project that column, so this page is
// metadata-only and the editor owns the body.

import { createFileRoute } from '@tanstack/react-router';

import { safeNumber } from '@zcat/ui';
import type { QueryClient } from '@tanstack/react-query';

import { ArticleDetailPage } from '@cms/features/article/components/article/article-detail';
import { withNotFound } from '@cms/shared/routing/not-found';
import { articleDetailQueryOptions } from '@cms/server/articles';

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
  return withNotFound(() =>
    context.queryClient.query({
      ...articleDetailQueryOptions({ id: articleId }),
      staleTime: 'static',
    }),
  );
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
