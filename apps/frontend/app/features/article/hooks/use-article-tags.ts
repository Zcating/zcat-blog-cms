/*
 * The mutations live here (rather than inside the manager
 * component) so the manager can stay declarative and so tests can
 * assert the cache shape independently of the React tree.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  articleTagsListQueryOptions,
  createArticleTagServerFn,
  deleteArticleTagServerFn,
  updateArticleTagServerFn,
} from '@cms/server/article-tags';
import type { ArticleTag } from '@cms/server/article-tags/schemas';

interface CreateArgs {
  name: string;
}
interface DeleteArgs {
  id: number;
}
interface UpdateArgs {
  id: number;
  name?: string;
}

export function useArticleTagCreate(): (
  args: CreateArgs,
) => Promise<ArticleTag> {
  const queryClient = useQueryClient();
  const options = articleTagsListQueryOptions();
  const mutation = useMutation({
    mutationFn: (args: CreateArgs) => createArticleTagServerFn({ data: args }),
  });

  return useCallback(
    async ({ name }: CreateArgs) => {
      const snapshot = queryClient.getQueryData<ArticleTag[]>(options.queryKey);

      // Optimistic insert with a temporary negative id so the row
      // is distinguishable from real persisted rows.
      const optimistic: ArticleTag = {
        id: -Date.now(),
        name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      queryClient.setQueryData<ArticleTag[]>(options.queryKey, (prev) =>
        prev ? [...prev, optimistic] : [optimistic],
      );

      try {
        const tag = await mutation.mutateAsync({ name });
        queryClient.setQueryData<ArticleTag[]>(options.queryKey, (prev) => {
          if (!prev) return [tag];
          return prev.map((row) => (row.id === optimistic.id ? tag : row));
        });
        return tag;
      } catch (error) {
        queryClient.setQueryData(options.queryKey, snapshot);
        throw error;
      }
    },
    [queryClient, options.queryKey, mutation],
  );
}

export function useArticleTagDelete(): (args: DeleteArgs) => Promise<void> {
  const queryClient = useQueryClient();
  const options = articleTagsListQueryOptions();
  const mutation = useMutation({
    mutationFn: (args: DeleteArgs) => deleteArticleTagServerFn({ data: args }),
  });

  return useCallback(
    async ({ id }: DeleteArgs) => {
      const snapshot = queryClient.getQueryData<ArticleTag[]>(options.queryKey);
      queryClient.setQueryData<ArticleTag[]>(options.queryKey, (prev) =>
        prev ? prev.filter((row) => row.id !== id) : prev,
      );
      try {
        await mutation.mutateAsync({ id });
      } catch (error) {
        queryClient.setQueryData(options.queryKey, snapshot);
        throw error;
      }
    },
    [queryClient, options.queryKey, mutation],
  );
}

export function useArticleTagUpdate(): (
  args: UpdateArgs,
) => Promise<ArticleTag> {
  const queryClient = useQueryClient();
  const options = articleTagsListQueryOptions();
  const mutation = useMutation({
    mutationFn: (args: UpdateArgs) => updateArticleTagServerFn({ data: args }),
  });

  return useCallback(
    async ({ id, name }: UpdateArgs) => {
      const snapshot = queryClient.getQueryData<ArticleTag[]>(options.queryKey);
      queryClient.setQueryData<ArticleTag[]>(options.queryKey, (prev) =>
        prev
          ? prev.map((row) =>
              row.id === id ? { ...row, name: name ?? row.name } : row,
            )
          : prev,
      );
      try {
        const tag = await mutation.mutateAsync({ id, name });
        queryClient.setQueryData<ArticleTag[]>(options.queryKey, (prev) =>
          prev ? prev.map((row) => (row.id === id ? tag : row)) : prev,
        );
        return tag;
      } catch (error) {
        queryClient.setQueryData(options.queryKey, snapshot);
        throw error;
      }
    },
    [queryClient, options.queryKey, mutation],
  );
}
