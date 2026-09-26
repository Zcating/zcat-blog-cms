/**
 * Album cache mutations for the album list and album detail pages.
 *
 * The route loaders prefetch the album slots with
 * `staleTime: 'static'`, so a mutation that never writes the Query
 * cache is never refetched: the next mount re-seeds from the
 * unmutated payload. Every hook here therefore
 *
 *   - snapshots the album cache slots it is about to touch,
 *   - writes the optimistic value in with `setQueryData`,
 *   - replaces the optimistic placeholder with the server response
 *     on success,
 *   - restores the snapshot on rejection.
 *
 * No retries — per the Phase 3b contract, ADR-0003. `useUpdateAlbum`
 * is shared by both pages because an album rename has to reach the
 * list slot and the detail slot, whichever page issued it.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient, QueryKey } from '@tanstack/react-query';

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

interface AlbumListMutationContext {
  previous: PaginatedPhotoAlbums | undefined;
  optimisticId: number;
}

interface AlbumUpdateMutationContext {
  detail: PhotoAlbumDetail | undefined;
  lists: Array<[QueryKey, PaginatedPhotoAlbums | undefined]>;
}

/**
 * crypto.randomUUID() 避免 Date.now() 冲突（连续点击新增会覆盖乐观更新）
 */
function buildOptimisticAlbumId(): number {
  return -Number.parseInt(
    crypto.randomUUID().replace(/-/g, '').slice(0, 13),
    16,
  );
}

function restoreLists(
  queryClient: QueryClient,
  lists: Array<[QueryKey, PaginatedPhotoAlbums | undefined]>,
): void {
  for (const [key, data] of lists) {
    queryClient.setQueryData(key, data);
  }
}

/**
 * 乐观新增：调用 `createPhotoAlbum`，并把服务端返回的相册写入列表缓存
 * （失败时回滚到快照）。
 */
export function useCreateAlbum(input: UseAlbumListInput) {
  const queryClient = useQueryClient();
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
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotoAlbums>(
        options.queryKey,
      );
      const now = new Date().toISOString();
      const optimisticId = buildOptimisticAlbumId();
      const optimistic: PhotoAlbumData = {
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
      queryClient.setQueryData<PaginatedPhotoAlbums>(
        options.queryKey,
        (current) =>
          current
            ? { ...current, data: [...current.data, optimistic] }
            : current,
      );
      return { previous, optimisticId };
    },
    onError: (_error, _values, context) => {
      if (context) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
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
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({
        queryKey: albumsListQueryPrefix,
      });
      const detail = queryClient.getQueryData<PhotoAlbumDetail>(detailKey);
      const lists = queryClient.getQueriesData<PaginatedPhotoAlbums>({
        queryKey: albumsListQueryPrefix,
      });
      queryClient.setQueryData<PhotoAlbumDetail>(detailKey, (current) =>
        current
          ? {
              ...current,
              name: values.name,
              description: values.description,
              available: values.available,
            }
          : current,
      );
      queryClient.setQueriesData<PaginatedPhotoAlbums>(
        { queryKey: albumsListQueryPrefix },
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
      return { detail, lists };
    },
    onError: (_error, values, context) => {
      if (!context) return;
      queryClient.setQueryData(
        photoAlbumDetailQueryOptions({ id: values.id }).queryKey,
        context.detail,
      );
      restoreLists(queryClient, context.lists);
    },
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
 * 乐观删除：调用 `deletePhotoAlbum`，并从列表缓存移除该相册（失败时回滚
 * 到快照）。
 */
export function useDeleteAlbum(input: UseAlbumListInput) {
  const queryClient = useQueryClient();
  const options = photoAlbumsListQueryOptions({
    page: input.page,
    pageSize: input.pageSize,
  });

  return useMutation<void, Error, number, AlbumListMutationContext>({
    mutationFn: async (id) => {
      await deletePhotoAlbum({ data: { id } });
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotoAlbums>(
        options.queryKey,
      );
      queryClient.setQueryData<PaginatedPhotoAlbums>(
        options.queryKey,
        (current) =>
          current
            ? { ...current, data: current.data.filter((row) => row.id !== id) }
            : current,
      );
      return { previous, optimisticId: id };
    },
    onError: (_error, _id, context) => {
      if (context) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
  });
}
