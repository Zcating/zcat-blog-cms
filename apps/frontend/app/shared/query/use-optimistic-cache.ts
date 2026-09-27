import { useQueryClient, type QueryKey } from '@tanstack/react-query';

type CacheUpdate<T> = (current: T | undefined) => T | undefined;

export function useOptimisticCache() {
  const queryClient = useQueryClient();

  return {
    async slot<T>(queryKey: QueryKey, update?: CacheUpdate<T>) {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<T>(queryKey);
      if (update) {
        queryClient.setQueryData<T>(queryKey, update);
      }
      return () => {
        if (previous !== undefined) {
          queryClient.setQueryData(queryKey, previous);
        }
      };
    },

    async prefix<T>(queryKey: QueryKey, update?: CacheUpdate<T>) {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueriesData<T>({ queryKey });
      if (update) {
        queryClient.setQueriesData<T>({ queryKey }, update);
      }
      return () => {
        for (const [key, data] of previous) {
          if (data !== undefined) {
            queryClient.setQueryData(key, data);
          }
        }
      };
    },
  };
}
