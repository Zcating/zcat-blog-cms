/*
 * `useSetAlbumCover` is the one mutation that cannot be fully
 * optimistic: the album list embeds the cover *photo* object, which
 * this page does not hold, so the list slot is invalidated instead.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { OssAction } from '@cms/core';
import {
  addPhotos,
  photoAlbumDetailQueryOptions,
  setPhotoAlbumCover,
} from '@cms/server/albums';
import type { PhotoAlbumDetail } from '@cms/server/albums/schemas';
import { photoListQueryOptions } from '@cms/server/photos';
import type {
  GetPhotosInput,
  PaginatedPhotos,
  Photo,
} from '@cms/server/photos/schemas';

import type { PhotoCardData } from '../components/album';

const albumsListQueryPrefix = ['albums', 'list'] as const;

export interface AlbumPhotoFormValues {
  id: number;
  name: string;
  image: string;
  albumId: number;
}

export interface AddAlbumPhotosValues {
  albumId: number;
  photos: Photo[];
}

interface PhotoListMutationContext {
  previous: PaginatedPhotos | undefined;
  optimisticId?: number;
}

function buildOptimisticPhotoId(): number {
  return -Date.now();
}

function buildOptimisticPhoto(
  values: AlbumPhotoFormValues,
  id: number,
): PhotoCardData {
  const now = new Date().toISOString();
  return {
    id,
    name: values.name,
    url: values.image,
    thumbnailUrl: values.image,
    albumId: values.albumId,
    createdAt: now,
    updatedAt: now,
    loading: true,
  };
}

/**
 * 乐观新增照片：上传并落库（`OssAction.createAlbumPhoto`），再把返回的
 * 照片写入相册照片缓存（失败时回滚到快照）。
 */
export function useCreateAlbumPhoto(input: GetPhotosInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<
    Photo,
    Error,
    AlbumPhotoFormValues,
    PhotoListMutationContext
  >({
    mutationFn: async (values) => {
      const photo = await OssAction.createAlbumPhoto({
        name: values.name,
        image: values.image,
        albumId: values.albumId,
      });
      if (!photo) {
        throw new Error('createAlbumPhoto returned no result');
      }
      return photo as Photo;
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotos>(
        options.queryKey,
      );
      // A form carrying an id is an edit of an existing row; a form
      // without one is a new upload, which needs a temporary
      // negative id so it is distinguishable from persisted rows.
      const optimisticId = values.id || buildOptimisticPhotoId();
      const optimistic = buildOptimisticPhoto(values, optimisticId);
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) => {
        if (!current) return current;
        return values.id
          ? {
              ...current,
              data: current.data.map((row) =>
                row.id === values.id ? optimistic : row,
              ),
            }
          : { ...current, data: [...current.data, optimistic] };
      });
      return { previous, optimisticId };
    },
    onError: (_error, _values, context) => {
      if (context) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (photo, _values, context) => {
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

/**
 * 乐观编辑照片：调用 `OssAction.updatePhoto`，并替换缓存中匹配的照片
 * （失败时回滚到快照）。
 */
export function useUpdateAlbumPhoto(input: GetPhotosInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<
    Photo,
    Error,
    AlbumPhotoFormValues,
    PhotoListMutationContext
  >({
    mutationFn: async (values) => {
      if (!values.id) {
        throw new Error('updatePhoto requires an existing id');
      }
      const photo = await OssAction.updatePhoto({
        id: values.id,
        name: values.name,
        image: values.image,
        albumId: values.albumId,
      });
      return photo as Photo;
    },
    onMutate: async (values) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotos>(
        options.queryKey,
      );
      if (values.id) {
        const optimistic = buildOptimisticPhoto(values, values.id);
        queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
          current
            ? {
                ...current,
                data: current.data.map((row) =>
                  row.id === values.id ? optimistic : row,
                ),
              }
            : current,
        );
      }
      return { previous, optimisticId: values.id };
    },
    onError: (_error, _values, context) => {
      if (context) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
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

/**
 * 乐观删除照片：调用 `OssAction.deletePhoto`，并从相册照片缓存移除该照片
 * （失败时回滚到快照）。
 */
export function useDeleteAlbumPhoto(input: GetPhotosInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<void, Error, number, PhotoListMutationContext>({
    mutationFn: async (id) => {
      await OssAction.deletePhoto(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotos>(
        options.queryKey,
      );
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
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

/**
 * 乐观批量关联：调用 `addPhotos`，并把选中的照片写入相册照片缓存（失败时
 * 回滚到快照）。新关联的照片排在前面，与旧的 `updateArray` 语义一致。
 */
export function useAddPhotosToAlbum(input: GetPhotosInput) {
  const queryClient = useQueryClient();
  const options = photoListQueryOptions(input);

  return useMutation<
    void,
    Error,
    AddAlbumPhotosValues,
    PhotoListMutationContext
  >({
    mutationFn: async ({ albumId, photos }) => {
      await addPhotos({
        data: {
          albumId,
          photoIds: photos.map((photo) => photo.id),
        },
      });
    },
    onMutate: async ({ albumId, photos }) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previous = queryClient.getQueryData<PaginatedPhotos>(
        options.queryKey,
      );
      const addedIds = new Set(photos.map((photo) => photo.id));
      const added = photos.map(
        (photo) =>
          ({
            ...photo,
            albumId,
            loading: true,
          }) as PhotoCardData,
      );
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
        current
          ? {
              ...current,
              data: [
                ...added,
                ...current.data.filter((row) => !addedIds.has(row.id)),
              ],
            }
          : current,
      );
      return { previous };
    },
    onError: (_error, _values, context) => {
      if (context) {
        queryClient.setQueryData(options.queryKey, context.previous);
      }
    },
    onSuccess: (_void, values) => {
      const committed = new Map(
        values.photos.map((photo) => [
          photo.id,
          { ...photo, albumId: values.albumId } as Photo,
        ]),
      );
      queryClient.setQueryData<PaginatedPhotos>(options.queryKey, (current) =>
        current
          ? {
              ...current,
              data: current.data.map((row) => committed.get(row.id) ?? row),
            }
          : current,
      );
    },
  });
}

/**
 * 设置相册封面：调用 `setPhotoAlbumCover`，并把 `coverId` 写入相册详情缓存
 * （失败时详情缓存保持不变）。相册列表内嵌的是封面照片对象，本页拿不到，
 * 因此列表槽改为失效而不是乐观写入。
 */
export function useSetAlbumCover(albumId: number) {
  const queryClient = useQueryClient();
  const detailKey = photoAlbumDetailQueryOptions({ id: albumId }).queryKey;

  return useMutation<void, Error, number>({
    mutationFn: async (photoId) => {
      await setPhotoAlbumCover({ data: { albumId, photoId } });
    },
    onSuccess: (_void, photoId) => {
      queryClient.setQueryData<PhotoAlbumDetail>(detailKey, (current) =>
        current ? { ...current, coverId: photoId } : current,
      );
      void queryClient.invalidateQueries({ queryKey: albumsListQueryPrefix });
    },
  });
}
