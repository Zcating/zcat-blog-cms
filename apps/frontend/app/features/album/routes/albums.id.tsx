/**
 * 乐观更新：相册编辑、照片的创建 / 编辑 / 删除 / 关联、设置封面全部走
 * `../hooks/use-albums` 与 `../hooks/use-album-photos`，由 hook 写入
 * Query 缓存并在失败时回滚到快照。页面不维护数组状态——loader 以
 * `staleTime: 'static'` 预热，只写本地状态的变更会在下次挂载时丢失。
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
import { coerceQueryInt } from '@cms/shared/hooks/use-pagination-action';
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
  // `queryFn` is a closure over a TanStack Start server function, which
  // TypeScript cannot infer through; the shapes are pinned by the
  // corresponding Zod schemas.
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

  const selectPhoto = async () => {
    // The legacy `Photo` shape declared `albumId: number | undefined`; the
    // server surface returns `number | null | undefined`, so narrow `null`
    // to `undefined` to keep the component contract intact.
    const candidates = reminderPhotos
      .filter((photo) => photo.albumId !== album.id)
      .map((photo) => ({
        id: photo.id,
        name: photo.name,
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl,
        signedUrl: photo.signedUrl,
        signedThumbnailUrl: photo.signedThumbnailUrl,
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
            // The legacy `Photo` shape declared `albumId: number |
            // undefined`; narrow `null` to `undefined` here.
            data={{
              ...item,
              albumId: item.albumId ?? undefined,
            }}
            onEdit={(data) =>
              editPhoto({
                id: data.id,
                name: data.name,
                image: data.signedUrl,
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
 * 页面 key 必须与路由 loader 预热的 key 完全一致，否则 SSR 首屏读不到
 * 缓存。这里用同一个 `coerceQueryInt` 保证两边算出同一组参数。
 */
function derivePhotoQueryInput(
  albumId: number,
  search: Record<string, unknown>,
): GetPhotosInput {
  return {
    albumId,
    page: coerceQueryInt(search.page, 1),
    pageSize: coerceQueryInt(search.pageSize, 20),
  };
}

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
 * `coverId` 直接读相册详情缓存，`useSetAlbumCover` 写入该槽，因此
 * 重新挂载后按钮状态依然与服务端一致。
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
