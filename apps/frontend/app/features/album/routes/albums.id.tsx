/**
 * 相册详情页（Phase 3b）。
 *
 * 数据来源：TanStack Query，通过三个并行的 `useSuspenseQuery`
 * 分别读取：
 *   1. `photoAlbumDetailQueryOptions({ id })`  — 当前相册元数据
 *   2. `photoListQueryOptions({ albumId, ... })` — 该相册下的照片分页
 *   3. `emptyAlbumPhotosQueryOptions()`        — 用于「选择照片」
 *                                                弹窗的未关联照片列表
 *
 * 路由 loader 已通过
 * `context.queryClient.query({ ...options, staleTime: 'static' })`
 * 并行预热上述三个缓存槽；本组件不再读 `useLoaderData` / `HttpClient`。
 *
 * 乐观更新：保留旧页面的 `useOptimisticArray` 语义（创建 / 编辑 /
 * 删除 / 添加到相册），失败时调用 `rollback` 还原。
 */

import { ZButton, ZDialog, ZGrid } from '@zcat/ui';
import React from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import zod from 'zod';

import {
  PhotoCard,
  showPhotoSelector,
  type PhotoCardData,
} from '@cms/features/album/components/album';
import {
  OssAction,
  createCheckbox,
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  createTextArea,
  PaginationWorkspace,
  useLoadingFn,
  useOptimisticArray,
} from '@cms/core';
import {
  addPhotos,
  photoAlbumDetailQueryOptions,
  setPhotoAlbumCover,
  updatePhotoAlbum,
} from '@cms/server/albums';
import type { PhotoAlbumDetail } from '@cms/server/albums/schemas';
import {
  emptyAlbumPhotosQueryOptions,
  photoListQueryOptions,
} from '@cms/server/photos';
import type {
  GetPhotosInput,
  PaginatedPhotos,
  Photo,
} from '@cms/server/photos/schemas';

interface AlbumPhotoFormData {
  id: number;
  name: string;
  image: string;
  albumId: number;
}

interface AlbumsIdProps {
  albumId: number;
  search: Record<string, unknown>;
}

export default function AlbumsId({ albumId, search }: AlbumsIdProps) {
  const photoQueryInput = derivePhotoQueryInput(albumId, search);
  const { data: albumRaw } = useSuspenseQuery(
    photoAlbumDetailQueryOptions({ id: albumId }),
  );
  const { data: photosRaw } = useSuspenseQuery(
    photoListQueryOptions(photoQueryInput),
  );
  const { data: reminderPhotosRaw } = useSuspenseQuery(
    emptyAlbumPhotosQueryOptions(),
  );
  // The `queryFn` in each `*QueryOptions` factory is a closure
  // over a TanStack Start server function, which TypeScript cannot
  // infer through. The shapes are pinned by the corresponding
  // Zod schemas, so we narrow here.
  const album = albumRaw as unknown as PhotoAlbumDetail;
  const albumPhotoPagination = photosRaw as unknown as PaginatedPhotos;
  const reminderPhotos = reminderPhotosRaw as unknown as Photo[];

  const [photos, addOptimisticPhoto, commitPhoto] = useOptimisticArray(
    albumPhotoPagination.data,
    (prev, data: AlbumPhotoFormData) => {
      const tempPhoto: PhotoCardData = {
        id: data.id || -Date.now(),
        name: data.name,
        url: data.image,
        thumbnailUrl: data.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loading: true,
        albumId: data.albumId,
      };
      if (data.id) {
        return prev.map((p) => (p.id === data.id ? tempPhoto : p));
      }
      return [...prev, tempPhoto];
    },
  );

  // 编辑相册
  const editAlbum = useAlbumForm({
    title: '编辑相册',
    confirmText: '保存',
    async onSubmit(data: AlbumFormValues) {
      try {
        await updatePhotoAlbum({
          data: {
            id: data.id,
            name: data.name,
            description: data.description,
            available: data.available,
          },
        });
      } catch (error) {
        console.error(error);
      }
    },
  });

  // 新增相册照片
  const addPhoto = usePhotoForm({
    title: '新增照片',
    async onSubmit(data: AlbumPhotoFormData) {
      React.startTransition(async () => {
        addOptimisticPhoto(data);
        try {
          const photo = await OssAction.createAlbumPhoto({
            name: data.name,
            image: data.image,
            albumId: album.id,
          });
          if (!photo) {
            commitPhoto('rollback');
            return;
          }
          commitPhoto('update', photo);
        } catch (error) {
          commitPhoto('rollback');
        }
      });
    },
  });

  // 编辑照片
  const editPhoto = usePhotoForm({
    title: '编辑照片',
    confirmText: '保存',
    async onSubmit(data: AlbumPhotoFormData) {
      React.startTransition(async () => {
        addOptimisticPhoto(data);

        try {
          const photo = await OssAction.updatePhoto({
            id: data.id,
            name: data.name,
            image: data.image,
            albumId: album.id,
          });
          if (!photo) {
            commitPhoto('rollback');
            return;
          }
          commitPhoto('update', photo);
        } catch (error) {
          console.error(error);
          commitPhoto('rollback');
        }
      });
    },
  });

  // 选择照片
  const selectPhoto = async () => {
    // `showPhotoSelector` was built against the legacy
    // `PhotosApi.Photo` shape (albumId: number | undefined). The
    // server surface now returns albumId: number | null | undefined
    // — narrow here so the two interfaces stay aligned.
    const candidates = reminderPhotos
      .filter((photo) => photo.albumId !== album.id)
      .map((photo) => ({
        id: photo.id,
        name: photo.name,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        albumId: photo.albumId ?? undefined,
        isCover: photo.isCover,
        createdAt: photo.createdAt,
        updatedAt: photo.updatedAt,
      }));
    const selectedPhotos = await showPhotoSelector({
      photos: candidates,
    });
    if (!selectedPhotos) {
      return;
    }

    React.startTransition(async () => {
      try {
        await addPhotos({
          data: {
            albumId: album.id,
            photoIds: selectedPhotos.map((photo) => photo.id),
          },
        });
        commitPhoto('batchUpdate', selectedPhotos);
      } catch (error) {
        commitPhoto('rollback');
      }
    });
  };

  // 删除照片
  const deletePhoto = async (photo: Photo) => {
    const confirm = await ZDialog.confirm({
      title: '删除照片',
      content: (
        <div>
          确定删除照片 <strong>{photo.name}</strong> 吗？
        </div>
      ),
    });
    if (!confirm) {
      return;
    }

    React.startTransition(async () => {
      try {
        await OssAction.deletePhoto(photo.id);
        commitPhoto('remove', photo);
      } catch (error) {
        commitPhoto('rollback');
      }
    });
  };

  // 设为封面
  const coverSetter = useCoverSetter(album);

  return (
    <PaginationWorkspace
      title={`相册名称：${album.name}`}
      description={`相册描述：${album.description ?? ''}`}
      operation={
        <div className="flex flex-wrap gap-2">
          <ZButton onClick={() => editAlbum(album)}>编辑相册</ZButton>
          <ZButton variant="outline" onClick={() => addPhoto()}>
            添加照片
          </ZButton>
          <ZButton variant="outline" onClick={selectPhoto}>
            选择照片
          </ZButton>
        </div>
      }
      pageSize={albumPhotoPagination.pageSize}
      totalPages={albumPhotoPagination.totalPages}
      page={albumPhotoPagination.page}
    >
      <ZGrid
        items={photos}
        cols={5}
        columnClassName="px-0"
        renderItem={(item) => (
          <PhotoCard
            // `PhotoCard` was built against the legacy
            // `PhotosApi.Photo` shape (albumId: number | undefined).
            // The server surface returns `albumId: number | null |
            // undefined`; narrow `null` to `undefined` so the
            // legacy component contract stays intact.
            data={{
              ...item,
              albumId: item.albumId ?? undefined,
            }}
            onEdit={(data) =>
              editPhoto({
                id: data.id,
                name: data.name,
                image: data.url,
                albumId: album.id,
              })
            }
            onDelete={deletePhoto}
            hoverComponent={coverSetter(item)}
          />
        )}
      />
    </PaginationWorkspace>
  );
}

interface AlbumFormValues {
  id: number;
  name: string;
  description: string;
  available: boolean;
}

/**
 * 从路由传入的 search 参数中派生照片分页 Query key，使页面 key 与
 * 路由 loader 预热的 key 保持一致。loader 已经用同样的参数调用了
 * `query({ ...options, staleTime: 'static' })`，因此 SSR 首次渲染命中缓存。
 */
function derivePhotoQueryInput(
  albumId: number,
  search: Record<string, unknown>,
): GetPhotosInput {
  return {
    albumId,
    page: coerceQueryNumber(search.page, 1),
    pageSize: coerceQueryNumber(search.pageSize, 20),
  };
}

function coerceQueryNumber(raw: unknown, defaultValue: number): number {
  if (raw == null || raw === '') {
    return defaultValue;
  }
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 照片编辑表单
 */
const usePhotoForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('照片名称'),
    image: createImageUpload('上传图片'),
    albumId: createConstNumber(),
  },
  schema: zod.object({
    id: zod.number().int().default(0),
    name: zod.string().min(1, '照片名称不能为空').default(''),
    image: zod.string().default(''),
    albumId: zod.number().int().default(0),
  }),
});

// 相册编辑表单
const useAlbumForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('相册名称'),
    description: createTextArea('相册描述'),
    available: createCheckbox('发布相册'),
  },
  schema: zod.object({
    id: zod.number().int().default(0),
    name: zod.string().min(1, '相册名称不能为空').default(''),
    description: zod.string().default(''),
    available: zod.boolean().default(false),
  }),
});

/**
 * 相册封面设置
 * @param {PhotoAlbumDetail} album 相册详情
 * @returns 封面设置组件
 */
function useCoverSetter(album: PhotoAlbumDetail) {
  const [coverId, setCoverId] = React.useState<number>(album?.coverId || 0);
  const setCover = useLoadingFn(async (photo: Photo) => {
    // selectPhotoDialog.show();
    try {
      await setPhotoAlbumCover({
        data: {
          photoId: photo.id,
          albumId: album.id,
        },
      });
      setCoverId(photo.id);
    } catch (error) {
      console.error(error);
    }
  });

  const RenderCoverButton = (photo: Photo) => {
    const isCover = coverId === photo.id;
    return isCover ? (
      <ZButton variant="destructive" loading={setCover.loading}>
        取消封面
      </ZButton>
    ) : (
      <ZButton onClick={() => setCover(photo)} loading={setCover.loading}>
        设为封面
      </ZButton>
    );
  };

  return RenderCoverButton;
}
