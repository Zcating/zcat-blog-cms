/*
 * The page MUST read its paginated data from the canonical
 * `photoListQueryOptions` cache, which the route loader prefetches with
 * `staleTime: 'static'`. A mutation failure restores the cache from the
 * snapshot taken before the optimistic update — no automatic retries.
 */

import { ZButton, ZDialog, ZGrid, ZNotification } from '@zcat/ui';
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

import { PhotoCard } from '../../album/components/album';

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

export default function Photos({ search }: PhotosListProps) {
  const listInput = derivePhotosListQueryInput(search);
  const { data: pagination } = usePhotosList(listInput);

  const createMutation = useCreatePhoto(listInput);

  const updateMutation = useUpdatePhoto(listInput);

  const deleteMutation = useDeletePhoto(listInput);

  const create = useSchemeForm({
    title: '新增照片',
    onSubmit: (data) => {
      const values = (data ?? {}) as PhotoFormData;
      void createMutation
        .mutateAsync({
          name: values.name || '新照片',
          image: values.image || '',
        })
        .then(
          () => ZNotification.success('照片已上传'),
          () => ZNotification.error('上传失败，请重试'),
        );
    },
  });

  const edit = useSchemeForm({
    title: '编辑照片',
    confirmText: '保存',
    cancelText: '取消',
    onSubmit: (data) => {
      const values = (data ?? {}) as PhotoFormData;
      void updateMutation
        .mutateAsync({
          id: values.id ?? 0,
          name: values.name || '',
          image: values.image || '',
        })
        .then(
          () => ZNotification.success('照片已保存'),
          () => ZNotification.error('保存失败，请重试'),
        );
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

    try {
      await deleteMutation.mutateAsync(data.id);
      await ZNotification.success('照片已删除');
    } catch {
      await ZNotification.error('删除失败，请重试');
    }
  };

  return (
    <PaginationWorkspace
      title="照片"
      operation={<ZButton onClick={() => create()}>新增</ZButton>}
      pageSize={pagination.pageSize}
      totalPages={pagination.totalPages}
      page={pagination.page}
    >
      {pagination.data.length === 0 ? (
        <ZGrid
          cols={5}
          items={[]}
          columnClassName="px-0"
          renderItem={() => null}
        />
      ) : (
        <ZGrid
          cols={5}
          items={pagination.data}
          columnClassName="px-0"
          renderItem={(item) => (
            <PhotoCard
              data={item}
              onEdit={(data) =>
                edit({
                  id: data.id,
                  name: data.name,
                  image: data.signedUrl,
                })
              }
              onDelete={deletePhoto}
            />
          )}
        />
      )}
      {pagination.data.length === 0 ? (
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
