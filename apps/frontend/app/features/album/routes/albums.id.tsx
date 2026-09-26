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
 * 乐观更新：相册编辑、照片的创建 / 编辑 / 删除 / 关联、设置封面全部走
 * `../hooks/use-albums` 与 `../hooks/use-album-photos`，由 hook 写入
 * Query 缓存并在失败时回滚到快照。页面只保留弹窗、表单接线与事件绑定，
 * 不再维护数组状态——loader 以 `staleTime: 'static'` 预热，只写本地
 * 状态的变更会在下次挂载时丢失。
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
  createCheckbox,
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  createTextArea,
  PaginationWorkspace,
  useLoadingFn,
} from '@cms/core';
import { photoAlbumDetailQueryOptions } from '@cms/server/albums';
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

import { type AlbumFormValues, useUpdateAlbum } from '../hooks/use-albums';
import {
  type AlbumPhotoFormValues,
  useAddPhotosToAlbum,
  useCreateAlbumPhoto,
  useDeleteAlbumPhoto,
  useSetAlbumCover,
  useUpdateAlbumPhoto,
} from '../hooks/use-album-photos';

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
  // 变更期间缓存里带 `loading: true` 的行就是乐观更新的行，
  // 所以照片网格直接渲染缓存即可。
  const photos = albumPhotoPagination.data as PhotoCardData[];

  const updateAlbum = useUpdateAlbum();
  const createPhotoMutation = useCreateAlbumPhoto(photoQueryInput);
  const updatePhotoMutation = useUpdateAlbumPhoto(photoQueryInput);
  const deletePhotoMutation = useDeleteAlbumPhoto(photoQueryInput);
  const addPhotosMutation = useAddPhotosToAlbum(photoQueryInput);

  // 编辑相册
  const editAlbum = useAlbumForm({
    title: '编辑相册',
    confirmText: '保存',
    async onSubmit(data: AlbumFormValues) {
      try {
        await updateAlbum.mutateAsync(data);
      } catch (error) {
        console.error(error);
      }
    },
  });

  // 新增相册照片
  const addPhoto = usePhotoForm({
    title: '新增照片',
    async onSubmit(data: AlbumPhotoFormValues) {
      React.startTransition(async () => {
        try {
          await createPhotoMutation.mutateAsync(data);
        } catch (error) {
          console.error(error);
        }
      });
    },
  });

  // 编辑照片
  const editPhoto = usePhotoForm({
    title: '编辑照片',
    confirmText: '保存',
    async onSubmit(data: AlbumPhotoFormValues) {
      React.startTransition(async () => {
        try {
          await updatePhotoMutation.mutateAsync(data);
        } catch (error) {
          console.error(error);
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
        await addPhotosMutation.mutateAsync({
          albumId: album.id,
          photos: selectedPhotos,
        });
      } catch (error) {
        console.error(error);
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
        await deletePhotoMutation.mutateAsync(photo.id);
      } catch (error) {
        console.error(error);
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
 *
 * `coverId` 直接读相册详情缓存，`useSetAlbumCover` 写入该槽，因此
 * 重新挂载后按钮状态依然与服务端一致。
 * @param {PhotoAlbumDetail} album 相册详情
 * @returns 封面设置组件
 */
function useCoverSetter(album: PhotoAlbumDetail) {
  const setCoverMutation = useSetAlbumCover(album.id);
  const coverId = album.coverId ?? 0;
  const setCover = useLoadingFn(async (photo: Photo) => {
    try {
      await setCoverMutation.mutateAsync(photo.id);
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
