/*
 * The page MUST read its paginated data from the canonical
 * `photoListQueryOptions` cache, which the route loader prefetches with
 * `staleTime: 'static'`. A mutation failure restores the cache from the
 * snapshot taken before the optimistic update — no automatic retries.
 */

import { ZButton, ZDialog, ZGrid } from '@zcat/ui';
import React from 'react';
import z from 'zod';

import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  PaginationWorkspace,
} from '@cms/core';
import type { GetPhotosInput, Photo } from '@cms/server/photos/schemas';
import { coerceQueryInt } from '@cms/shared/hooks/use-pagination-action';

import { PhotoCard, type PhotoCardData } from '../../album/components/album';

import {
  useCreatePhoto,
  useDeletePhoto,
  usePhotosList,
  useUpdatePhoto,
} from '../hooks/use-photos';

interface PhotoFormData {
  id: number;
  name: string;
  image: string;
}

interface PhotosListProps {
  search: Record<string, unknown>;
}

const useSchemeForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('名称'),
    image: createImageUpload('图片'),
  },
  schema: z.object({
    id: z.number().default(0),
    name: z.string().min(1, '照片名称不能为空').default('新照片'),
    image: z.string().default(''),
  }),
});

function buildOptimisticPhoto(data: PhotoFormData): PhotoCardData {
  return {
    id: data.id || -Date.now(),
    name: data.name,
    url: data.image,
    thumbnailUrl: data.image,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    loading: true,
  };
}

export default function Photos({ search }: PhotosListProps) {
  const listInput = derivePhotosListQueryInput(search);
  const { data: pagination } = usePhotosList(listInput);

  const createMutation = useCreatePhoto(listInput);

  const updateMutation = useUpdatePhoto(listInput);

  const deleteMutation = useDeletePhoto(listInput);

  const [optimisticPhotos, setOptimisticPhotos] = React.useState<
    PhotoCardData[]
  >(() => pagination.data as PhotoCardData[]);

  React.useEffect(() => {
    setOptimisticPhotos(pagination.data as PhotoCardData[]);
  }, [pagination.data]);

  const create = useSchemeForm({
    title: '新增照片',
    onSubmit: (data) => {
      const values = (data ?? {}) as PhotoFormData;
      const normalized: PhotoFormData = {
        id: 0,
        name: values.name || '新照片',
        image: values.image || '',
      };
      setOptimisticPhotos((prev) => {
        const optimistic = buildOptimisticPhoto(normalized);
        return [...prev, optimistic];
      });
      void createMutation
        .mutateAsync({
          name: normalized.name,
          image: normalized.image,
        })
        .catch(() => {
          // Rollback the optimistic insert on error.
          setOptimisticPhotos(pagination.data as PhotoCardData[]);
        });
    },
  });

  const edit = useSchemeForm({
    title: '编辑照片',
    confirmText: '保存',
    cancelText: '取消',
    onSubmit: (data) => {
      const values = (data ?? {}) as PhotoFormData;
      const normalized: PhotoFormData = {
        id: values.id ?? 0,
        name: values.name || '',
        image: values.image || '',
      };
      setOptimisticPhotos((prev) => {
        const optimistic = buildOptimisticPhoto(normalized);
        if (normalized.id) {
          return prev.map((p) => (p.id === normalized.id ? optimistic : p));
        }
        return [...prev, optimistic];
      });
      void updateMutation
        .mutateAsync({
          id: normalized.id,
          name: normalized.name,
          image: normalized.image,
        })
        .catch(() => {
          setOptimisticPhotos(pagination.data as PhotoCardData[]);
        });
    },
  });

  const deletePhoto = async (data: Photo) => {
    const confirm = await ZDialog.confirm({
      title: '删除照片',
      content: (
        <div>
          确定删除照片 <strong>{data.name}</strong> 吗？
        </div>
      ),
    });

    if (!confirm) {
      return;
    }
    setOptimisticPhotos((prev) => prev.filter((p) => p.id !== data.id));
    void deleteMutation.mutateAsync(data.id).catch(() => {
      setOptimisticPhotos(pagination.data as PhotoCardData[]);
    });
  };

  return (
    <PaginationWorkspace
      title="照片"
      operation={<ZButton onClick={() => create()}>新增</ZButton>}
      pageSize={pagination.pageSize}
      totalPages={pagination.totalPages}
      page={pagination.page}
    >
      {optimisticPhotos.length === 0 ? (
        <ZGrid
          cols={5}
          items={[]}
          columnClassName="px-0"
          renderItem={() => null}
        />
      ) : (
        <ZGrid
          cols={5}
          items={optimisticPhotos}
          columnClassName="px-0"
          renderItem={(item) => (
            <PhotoCard
              data={item}
              onEdit={(data) =>
                edit({
                  id: data.id,
                  name: data.name,
                  image: data.url,
                })
              }
              onDelete={deletePhoto}
            />
          )}
        />
      )}
      {optimisticPhotos.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          暂无照片
        </div>
      ) : null}
    </PaginationWorkspace>
  );
}

/**
 * 页面 key 必须与路由 loader 预热的 key 完全一致，否则 SSR 首屏读不到缓存。
 */
function derivePhotosListQueryInput(
  search: Record<string, unknown>,
): GetPhotosInput {
  const albumId = coerceQueryInt(search.albumId, 0);
  return {
    albumId: albumId > 0 ? albumId : undefined,
    page: coerceQueryInt(search.page, 1),
    pageSize: coerceQueryInt(search.pageSize, 20),
  };
}
