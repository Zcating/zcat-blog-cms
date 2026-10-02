import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { articlesListQueryOptions, deleteArticle } from '@cms/server/articles';
import type { Article, PaginatedArticles } from '@cms/server/articles/schemas';

type ArticleListCacheEntry = PaginatedArticles | undefined;

interface DeleteArgs {
  id: number;
}

/**
 * Only the page the caller passes is mutated — pages the
 * user is not currently viewing are not touched (no cross-page
 * pre-emptive invalidation).
 */
export function useArticleListDelete(
  page: number,
  pageSize: number,
): (args: DeleteArgs) => Promise<void> {
  const queryClient = useQueryClient();
  const listOptions = articlesListQueryOptions({ page, pageSize });

  const mutation = useMutation({
    mutationFn: (args: DeleteArgs) => deleteArticle({ data: args }),
  });

  return useCallback(
    async ({ id }: DeleteArgs) => {
      const snapshot = queryClient.getQueryData<PaginatedArticles>(
        listOptions.queryKey,
      );

      queryClient.setQueryData<PaginatedArticles>(
        listOptions.queryKey,
        (prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            data: prev.data.filter((row) => row.id !== id),
            total: Math.max(0, prev.total - 1),
          };
        },
      );

      try {
        await mutation.mutateAsync({ id });
      } catch (error) {
        // Restore the exact pre-mutation shape so list ordering and
        // `total` stay consistent.
        queryClient.setQueryData(listOptions.queryKey, snapshot);
        throw error;
      }
    },
    [queryClient, listOptions.queryKey, mutation],
  );
}

/**
 * Pure helper used by callers that already operate outside a
 * React tree (e.g. tests). Mirrors the cache mutation in
 * `useArticleListDelete` so the test surface and the hook surface
 * share the same optimistic algorithm.
 */
export function applyOptimisticDelete(
  cache: ArticleListCacheEntry,
  id: number,
): ArticleListCacheEntry {
  if (!cache) return cache;
  return {
    ...cache,
    data: cache.data.filter((row: Article) => row.id !== id),
    total: Math.max(0, cache.total - 1),
  };
}
