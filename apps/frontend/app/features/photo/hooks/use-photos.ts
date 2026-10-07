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
  optimisticId?: number;
}

export interface PhotoFormPayload {
  id?: number;
  name: string;
  image?: string;
}

/**
 * 乐观行：id 为负数表示尚未落库，成功后由 onSuccess 换成服务端 id。
 */
function buildOptimisticPhoto(values: PhotoFormPayload, id: number): Photo {
  const now = new Date().toISOString();
  return {
    id,
    name: values.name,
    url: values.image ?? '',
    thumbnailUrl: values.image ?? '',
    signedUrl: values.image ?? '',
    signedThumbnailUrl: values.image ?? '',
    albumId: null,
    createdAt: now,
    updatedAt: now,
    loading: true,
  } as Photo;
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
    onMutate: async (payload) => {
      const optimisticId = -Date.now();
      const row = buildOptimisticPhoto(payload, optimisticId);
      const restore = await optimistic.slot<PaginatedPhotos>(
        options.queryKey,
        (current) =>
          current ? { ...current, data: [...current.data, row] } : current,
      );
      return { restore, optimisticId };
    },
    onError: (_error, _payload, context) => context?.restore(),
    onSuccess: (photo, _payload, context) => {
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((row) =>
                row.id === context?.optimisticId ? photo : row,
              ),
            }
          : current,
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
    onMutate: async (payload) => {
      const row = buildOptimisticPhoto(payload, payload.id ?? -Date.now());
      const restore = await optimistic.slot<PaginatedPhotos>(
        options.queryKey,
        (current) => {
          if (!current || !payload.id) return current;
          return {
            ...current,
            data: current.data.map((existing) =>
              existing.id === payload.id ? row : existing,
            ),
          };
        },
      );
      return { restore, optimisticId: payload.id };
    },
    onError: (_error, _payload, context) => context?.restore(),
    onSuccess: (photo) => {
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((row) =>
                row.id === photo.id ? photo : row,
              ),
            }
          : current,
      );
    },
  });
}

export function useDeletePhoto(input: UsePhotosListInput) {
  const optimistic = useOptimisticCache();
  const options = photoListQueryOptions(input);

  return useMutation<void, Error, number, PhotoMutationContext>({
    mutationFn: async (id) => {
      await OssAction.deletePhoto(id);
    },
    onMutate: (id) =>
      optimistic
        .slot<PaginatedPhotos>(options.queryKey, (current) =>
          current
            ? { ...current, data: current.data.filter((row) => row.id !== id) }
            : current,
        )
        .then((restore) => ({ restore })),
    onError: (_error, _id, context) => context?.restore(),
  });
}
