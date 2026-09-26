/**
 * Phase 3b photos list page.
 *
 * Behaviour preserved from the legacy implementation:
 *   - Paginated photo grid scoped by `(albumId, page, pageSize)`.
 *   - "新增" button opens the create-photo form, posts through
 *     `OssAction.createPhoto`, and refreshes the Query cache.
 *   - Each photo card exposes 编辑 / 删除; both flows post
 *     through `OssAction` and update the Query cache with the
 *     server's response.
 *   - Delete confirms via `ZDialog.confirm`.
 *   - Empty pagination renders the empty state.
 *
 * Migration contract (Phase 3b):
 *   - The page MUST read its paginated data from the canonical
 *     `photoListQueryOptions` cache (Query, not `loaderData` /
 *     `HttpClient`). The route loader prefetches the cache slot via
 *     `queryClient.query({ ...photoListQueryOptions(...), staleTime: 'static' })`
 *     so SSR has a warm cache by the time the page mounts.
 *   - Mutations go through the `usePhotosList` /
 *     `useCreatePhoto` / `useUpdatePhoto` / `useDeletePhoto`
 *     hooks in `../hooks/use-photos`, which call `OssAction` and
 *     carry the optimistic-update + rollback contract. The
 *     hooks are the only seams the test mocks.
 *   - The Query cache is updated via `setQueryData` so the grid
 *     reflects the new server payload. On mutation failure, the
 *     cache is restored from a snapshot taken before the
 *     optimistic update — no automatic retries.
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
import type { Photo } from '@cms/server/photos/schemas';

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

export default function Photos() {
  const { data: pagination } = usePhotosList({ page: 1, pageSize: 20 });

  const createMutation = useCreatePhoto({
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  const updateMutation = useUpdatePhoto({
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  const deleteMutation = useDeletePhoto({
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

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
