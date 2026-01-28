import {
  ZButton,
  ZDialog,
  ZGrid,
  ZPagination,
  ZSelect,
  ZView,
  safeNumber,
} from '@zcat/ui';
import React from 'react';
import z from 'zod';

import { PhotosApi } from '@cms/api';
import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  OssAction,
  PhotoCard,
  Workspace,
  useOptimisticArray,
  type PhotoCardData,
  usePaginationAction,
  PAGE_SIZE_OPTIONS,
} from '@cms/core';

import type { Route } from './+types/photos';

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

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const page = safeNumber(url.searchParams.get('page'), 1);
  const pageSize = safeNumber(url.searchParams.get('pageSize'), 20);

  const result = await PhotosApi.getPhotos({ page, pageSize });
  return {
    pagination: result,
    page,
    pageSize,
  };
}

export default function Photos(props: Route.ComponentProps) {
  const currentPage = props.loaderData.page;
  const currentPageSize = props.loaderData.pageSize;

  const pagination = props.loaderData.pagination;

  const action = usePaginationAction(currentPageSize);

  const [optimisticPhotos, setOptimisticPhotos, commitPhotos] =
    useOptimisticArray(pagination.data, (prev, data: PhotoFormData) => {
      const tempPhoto: PhotoCardData = {
        id: data.id || -Date.now(),
        name: data.name,
        url: data.image,
        thumbnailUrl: data.image,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loading: true,
      };
      if (data.id) {
        return prev.map((p) => (p.id === data.id ? tempPhoto : p));
      }
      return [...prev, tempPhoto];
    });

  const create = useSchemeForm({
    title: '新增照片',
    onSubmit: (data) => {
      React.startTransition(async () => {
        setOptimisticPhotos(data);

        try {
          const photo = await OssAction.createPhoto({
            name: data.name,
            image: data.image,
          });
          if (!photo) {
            commitPhotos('rollback');
            return;
          }
          commitPhotos('update', photo);
        } catch (error) {
          console.error(error);
          commitPhotos('rollback');
        }
      });
    },
  });

  const edit = useSchemeForm({
    title: '编辑照片',
    confirmText: '保存',
    cancelText: '取消',
    onSubmit: async (data) => {
      React.startTransition(async () => {
        setOptimisticPhotos(data);
        try {
          const photo = await OssAction.updatePhoto(data);
          if (!photo) {
            commitPhotos('rollback');
            return;
          }

          commitPhotos('update', photo);
        } catch (error) {
          console.log(error);
          commitPhotos('rollback');
        }
      });
    },
  });

  const deletePhoto = async (data: PhotosApi.Photo) => {
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
    React.startTransition(async () => {
      setOptimisticPhotos({
        id: data.id,
        name: data.name,
        image: data.thumbnailUrl,
      });
      await PhotosApi.deletePhoto(data.id);
      commitPhotos('remove', data);
    });
  };

  return (
    <Workspace
      title="照片"
      operation={<ZButton onClick={() => create()}>新增</ZButton>}
    >
      {optimisticPhotos.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          暂无照片
        </div>
      ) : (
        <ZView className="space-y-10">
          <ZGrid
            cols={5}
            items={optimisticPhotos}
            columnClassName="px-0"
            renderItem={(item) => (
              <PhotoCard data={item} onEdit={edit} onDelete={deletePhoto} />
            )}
          />
          <ZView className="flex items-center justify-center gap-5">
            <ZSelect
              options={PAGE_SIZE_OPTIONS}
              value={currentPageSize.toString()}
              onValueChange={action.onPageSizeChange}
              className="w-40"
            />
            <ZPagination
              page={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={action.onPageChange}
            />
          </ZView>
        </ZView>
      )}
    </Workspace>
  );
}
