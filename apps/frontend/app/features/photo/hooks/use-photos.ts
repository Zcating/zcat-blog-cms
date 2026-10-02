import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query';
import { OssAction } from '@cms/core';
import { useOptimisticCache } from '@cms/shared/query/use-optimistic-cache';
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
  restore: () => void;
}

export interface PhotoFormPayload {
  id?: number;
  name: string;
  image?: string;
}

export function useCreatePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticCache();
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
    onMutate: (payload) =>
      optimistic.slot(options.queryKey).then((restore) => ({ restore })),
    onError: (_error, _payload, context) => context?.restore(),
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

export function useUpdatePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticCache();
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
    onMutate: (payload) =>
      optimistic.slot(options.queryKey).then((restore) => ({ restore })),
    onError: (_error, _payload, context) => context?.restore(),
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

export function useDeletePhoto(input: UsePhotosListInput) {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticCache();
  const options = photoListQueryOptions(input);

  return useMutation<void, Error, number, PhotoMutationContext>({
    mutationFn: async (id) => {
      await OssAction.deletePhoto(id);
    },
    onMutate: (id) =>
      optimistic.slot(options.queryKey).then((restore) => ({ restore })),
    onError: (_error, _id, context) => context?.restore(),
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
