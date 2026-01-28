import { ZButton, ZDialog, ZGrid, ZPagination, ZSelect } from '@zcat/ui';
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

const PAGE_SIZE_OPTIONS = [
  { label: '每页 10 条', value: '10' },
  { label: '每页 20 条', value: '20' },
  { label: '每页 50 条', value: '50' },
];

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page')) || 1;
  const pageSize = Number(url.searchParams.get('pageSize')) || 20;

  const result = await PhotosApi.getPhotos({ page, pageSize });

  return {
    photos: result.data as PhotoCardData[],
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    },
  };
}

export default function Photos(props: Route.ComponentProps) {
  const [searchParams, setSearchParams] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      page: Number(params.get('page')) || 1,
      pageSize: Number(params.get('pageSize')) || 20,
    };
  });

  const initialPage = searchParams.page;
  const initialPageSize = searchParams.pageSize;

  const [photos, setOptimisticPhotos, commitPhotos] = useOptimisticArray(
    props.loaderData.photos,
    (prev, data: PhotoFormData) => {
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
    },
  );

  const [photosData, setPhotosData] = React.useState(photos);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = React.useState(initialPageSize);
  const [isLoading, setIsLoading] = React.useState(false);
  const [totalPages, setTotalPages] = React.useState(
    props.loaderData.pagination.totalPages,
  );

  const fetchPhotos = React.useCallback(
    async (page: number, pageSize: number) => {
      setIsLoading(true);
      try {
        const result = await PhotosApi.getPhotos({ page, pageSize });
        setPhotosData(
          result.data.map((photo) => ({
            ...photo,
            createdAt: photo.createdAt?.toString(),
            updatedAt: photo.updatedAt?.toString(),
          })) as PhotoCardData[],
        );
        setTotalPages(result.totalPages);
      } catch (error) {
        console.error('获取照片列表失败', error);
      } finally {
        setIsLoading(false);
      }
    },
    [setPhotosData, setTotalPages],
  );

  const handlePageChange = React.useCallback(
    (page: number) => {
      setCurrentPage(page);
      setSearchParams({
        page: page,
        pageSize: itemsPerPage,
      });
      fetchPhotos(page, itemsPerPage);
    },
    [itemsPerPage, fetchPhotos],
  );

  const handlePageSizeChange = React.useCallback(
    (value: string) => {
      const pageSize = Number(value);
      setItemsPerPage(pageSize);
      setCurrentPage(1);
      setSearchParams({ page: 1, pageSize });
      fetchPhotos(1, pageSize);
    },
    [fetchPhotos],
  );

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else if (e.key === 'ArrowRight' && currentPage < totalPages) {
        handlePageChange(currentPage + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, handlePageChange]);

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
          fetchPhotos(currentPage, itemsPerPage);
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
          fetchPhotos(currentPage, itemsPerPage);
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
      fetchPhotos(currentPage, itemsPerPage);
    });
  };

  return (
    <Workspace
      title="照片"
      operation={<ZButton onClick={() => create()}>新增</ZButton>}
    >
      {isLoading && photosData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          加载中...
        </div>
      ) : photosData.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          暂无照片
        </div>
      ) : (
        <>
          <ZGrid
            cols={5}
            items={photosData}
            columnClassName="px-0"
            renderItem={(item) => (
              <PhotoCard data={item} onEdit={edit} onDelete={deletePhoto} />
            )}
          />
          <div className="mt-4 flex items-center justify-between">
            <ZSelect
              value={itemsPerPage.toString()}
              options={PAGE_SIZE_OPTIONS}
              onValueChange={handlePageSizeChange}
              className="w-40"
            />
            <ZPagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </Workspace>
  );
}
