// `id` is optional: when it is absent or non-numeric the loader warms
// only the tag list and the editor renders a blank form.

import { createFileRoute } from '@tanstack/react-router';

import { safeNumber } from '@zcat/ui';
import type { QueryClient } from '@tanstack/react-query';

import { ArticleEditorPage } from '@cms/features/article/components/article/article-editor';
import { withNotFound } from '@cms/shared/routing/not-found';
import { articleDetailQueryOptions } from '@cms/server/articles';
import { articleTagsListQueryOptions } from '@cms/server/article-tags';

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
    withNotFound(() =>
      queryClient.query({
        ...articleDetailQueryOptions({ id }),
        staleTime: 'static',
      }),
    ),
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
