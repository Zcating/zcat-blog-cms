/*
 * The route loaders prefetch the album slots with
 * `staleTime: 'static'`, so a mutation that never writes the Query
 * cache is never refetched: the next mount re-seeds from the
 * unmutated payload.
 *
 * No retries, per ADR-0003. `useUpdateAlbum`
 * is shared by both pages because an album rename has to reach the
 * list slot and the detail slot, whichever page issued it.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useOptimisticCache } from '@cms/shared/query/use-optimistic-cache';
import {
  createPhotoAlbum,
  deletePhotoAlbum,
  photoAlbumDetailQueryOptions,
  photoAlbumsListQueryOptions,
  updatePhotoAlbum,
} from '@cms/server/albums';
import type {
  PaginatedPhotoAlbums,
  PhotoAlbum,
  PhotoAlbumDetail,
} from '@cms/server/albums/schemas';

import type { PhotoAlbumData } from '../components/album';

const albumsListQueryPrefix = ['albums', 'list'] as const;

export interface AlbumFormValues {
  id: number;
  name: string;
  description: string;
  available: boolean;
}

export interface CreateAlbumValues {
  name: string;
  description: string;
  available: boolean;
}

export interface UseAlbumListInput {
  page: number;
  pageSize: number;
}

interface MutationRollbackContext {
  restore: () => void;
}

interface AlbumListMutationContext extends MutationRollbackContext {
  optimisticId: number;
}

type AlbumUpdateMutationContext = MutationRollbackContext;

/**
 * crypto.randomUUID() 避免 Date.now() 冲突（连续点击新增会覆盖乐观更新）
 */
function buildOptimisticAlbumId(): number {
  return -Number.parseInt(
    crypto.randomUUID().replace(/-/g, '').slice(0, 13),
    16,
  );
}

/**
 * 乐观新增：调用 `createPhotoAlbum`，失败时回滚到快照。
 */
export function useCreateAlbum(input: UseAlbumListInput) {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticCache();
  const options = photoAlbumsListQueryOptions({
    page: input.page,
    pageSize: input.pageSize,
  });

  return useMutation<
    PhotoAlbum,
    Error,
    CreateAlbumValues,
    AlbumListMutationContext
  >({
    mutationFn: async (values) => {
      const album = await createPhotoAlbum({
        data: {
          name: values.name,
          description: values.description,
          available: values.available,
        },
      });
      if (!album) {
        throw new Error('createPhotoAlbum returned no result');
      }
      return album as PhotoAlbum;
    },
    onMutate: async (values) => {
      const now = new Date().toISOString();
      const optimisticId = buildOptimisticAlbumId();
      const optimisticRow: PhotoAlbumData = {
        id: optimisticId,
        name: values.name,
        description: values.description,
        available: values.available,
        coverId: null,
        cover: null,
        createdAt: now,
        updatedAt: now,
        loading: true,
      };
      const restore = await optimistic.slot<PaginatedPhotoAlbums>(
        options.queryKey,
        (current) =>
          current
            ? { ...current, data: [...current.data, optimisticRow] }
            : current,
      );
      return { restore, optimisticId };
    },
    onError: (_error, _values, context) => context?.restore(),
    onSuccess: (album, _values, context) => {
      queryClient.setQueryData<PaginatedPhotoAlbums>(
        options.queryKey,
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((row) =>
                  row.id === context?.optimisticId ? album : row,
                ),
              }
            : current,
      );
    },
  });
}

/**
 * 乐观编辑：调用 `updatePhotoAlbum`，并把返回的相册写入详情缓存与所有
 * 已缓存的列表分页（失败时回滚到快照）。相册改名会同时影响详情页标题
 * 与列表页行，两处必须一致。
 */
export function useUpdateAlbum() {
  const queryClient = useQueryClient();
  const optimistic = useOptimisticCache();

  return useMutation<
    PhotoAlbum,
    Error,
    AlbumFormValues,
    AlbumUpdateMutationContext
  >({
    mutationFn: async (values) => {
      const album = await updatePhotoAlbum({
        data: {
          id: values.id,
          name: values.name,
          description: values.description,
          available: values.available,
        },
      });
      if (!album) {
        throw new Error('updatePhotoAlbum returned no result');
      }
      return album as PhotoAlbum;
    },
    onMutate: async (values) => {
      const detailKey = photoAlbumDetailQueryOptions({
        id: values.id,
      }).queryKey;
      const restoreDetail = await optimistic.slot<PhotoAlbumDetail>(
        detailKey,
        (current) =>
          current
            ? {
                ...current,
                name: values.name,
                description: values.description,
                available: values.available,
              }
            : current,
      );
      const restoreLists = await optimistic.prefix<PaginatedPhotoAlbums>(
        albumsListQueryPrefix,
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((row) =>
                  row.id === values.id
                    ? ({
                        ...row,
                        name: values.name,
                        description: values.description,
                        available: values.available,
                        loading: true,
                      } as PhotoAlbumData)
                    : row,
                ),
              }
            : current,
      );
      return {
        restore: () => {
          restoreDetail();
          restoreLists();
        },
      };
    },
    onError: (_error, _values, context) => context?.restore(),
    onSuccess: (album, values) => {
      queryClient.setQueryData<PhotoAlbumDetail>(
        photoAlbumDetailQueryOptions({ id: values.id }).queryKey,
        album,
      );
      queryClient.setQueriesData<PaginatedPhotoAlbums>(
        { queryKey: albumsListQueryPrefix },
        (current) =>
          current
            ? {
                ...current,
                data: current.data.map((row) =>
                  row.id === album.id ? album : row,
                ),
              }
            : current,
      );
    },
  });
}

/**
 * 乐观删除：从列表缓存移除该相册，失败时回滚到快照。
 */
export function useDeleteAlbum(input: UseAlbumListInput) {
  const optimistic = useOptimisticCache();
  const options = photoAlbumsListQueryOptions({
    page: input.page,
    pageSize: input.pageSize,
  });

  return useMutation<void, Error, number, MutationRollbackContext>({
    mutationFn: async (id) => {
      await deletePhotoAlbum({ data: { id } });
    },
    onMutate: (id) =>
      optimistic
        .slot<PaginatedPhotoAlbums>(options.queryKey, (current) =>
          current
            ? { ...current, data: current.data.filter((row) => row.id !== id) }
            : current,
        )
        .then((restore) => ({ restore })),
    onError: (_error, _id, context) => context?.restore(),
  });
}
