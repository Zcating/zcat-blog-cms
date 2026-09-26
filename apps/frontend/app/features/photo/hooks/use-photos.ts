/**
 * Hooks for the photos list page.
 *
 * `usePhotosList` is the read-side seam for the page: it returns
 * the canonical paginated photos Query slot so the page can
 * `useSuspenseQuery` from a warm cache without touching
 * `useLoaderData` or the legacy `HttpClient`. The mutation hooks
 * (`useCreatePhoto`, `useUpdatePhoto`, `useDeletePhoto`) carry the
 * optimistic-update + rollback contract that the page needs to
 * preserve the legacy UX.
 *
 * Each mutation:
 *   - snapshots the canonical Query slot before mutating,
 *   - writes the optimistic value into the cache via
 *     `setQueryData`,
 *   - rolls the cache back to the snapshot on error,
 *   - replaces the optimistic placeholder with the server's
 *     response on success.
 *
 * The `no retry` guarantee is preserved by the per-request
 * `QueryClient` factory (`makeQueryClient` sets
 * `defaultOptions.mutations.retry = false`).
 */

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { OssAction } from '@cms/core';
import { photoListQueryOptions } from '@cms/server/photos';
import type { PaginatedPhotos, Photo } from '@cms/server/photos/schemas';

export interface UsePhotosListInput {
  page: number;
  pageSize: number;
  albumId?: number;
}

/**
 * Read the paginated photos for `(albumId, page, pageSize)`. The
 * caller MUST have a warm cache slot — the route loader prefetches
 * it via `queryClient.query({ ...photoListQueryOptions(...), staleTime: 'static' })`
 * so SSR hands a hydrated cache to the page.
 */
export function usePhotosList(input: UsePhotosListInput) {
  const options = photoListQueryOptions(input);
  const query = useSuspenseQuery(options);
  return {
    ...query,
    queryKey: options.queryKey,
  };
}

interface PhotoMutationContext {
  previous: unknown;
}

export interface PhotoFormPayload {
  id?: number;
  name: string;
  image?: string;
}

/**
 * Optimistic create — uploads + records via `OssAction.createPhoto`
 * and inserts the server's response into the canonical cache
 * slot. The rollback path restores the pre-mutation snapshot.
 */
export function useCreatePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<Photo, Error, PhotoFormPayload, PhotoMutationContext>({
    mutationFn: async (payload) => {
      const photo = await OssAction.createPhoto({
        name: payload.name,
        image: payload.image ?? '',
      });
      if (!photo) {
        throw new Error('createPhoto returned no result');
      }
      return photo as Photo;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          options.queryKey,
          context.previous as PaginatedPhotos | undefined,
        );
      }
    },
    onSuccess: (photo) => {
      queryClient.setQueryData<PaginatedPhotos | undefined>(
        options.queryKey,
        (current) => {
          if (!current) return current;
          return { ...current, data: [...current.data, photo] };
        },
      );
    },
  });
}

/**
 * Optimistic update — calls `OssAction.updatePhoto` and replaces
 * the matching entry in the cache.
 */
export function useUpdatePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<Photo, Error, PhotoFormPayload, PhotoMutationContext>({
    mutationFn: async (payload) => {
      if (!payload.id) {
        throw new Error('updatePhoto requires an existing id');
      }
      const photo = await OssAction.updatePhoto({
        id: payload.id,
        name: payload.name,
        image: payload.image,
      });
      if (!photo) {
        throw new Error('updatePhoto returned no result');
      }
      return photo as Photo;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          options.queryKey,
          context.previous as PaginatedPhotos | undefined,
        );
      }
    },
    onSuccess: (photo) => {
      queryClient.setQueryData<PaginatedPhotos | undefined>(
        options.queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.map((p) => (p.id === photo.id ? photo : p)),
          };
        },
      );
    },
  });
}

/**
 * Optimistic delete — calls `OssAction.deletePhoto` and removes
 * the matching entry from the cache.
 */
export function useDeletePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<void, Error, number, PhotoMutationContext>({
    mutationFn: async (id) => {
      await OssAction.deletePhoto(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData(options.queryKey);
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(
          options.queryKey,
          context.previous as PaginatedPhotos | undefined,
        );
      }
    },
    onSuccess: (_void, id) => {
      queryClient.setQueryData<PaginatedPhotos | undefined>(
        options.queryKey,
        (current) => {
          if (!current) return current;
          return {
            ...current,
            data: current.data.filter((p) => p.id !== id),
          };
        },
      );
    },
  });
}
