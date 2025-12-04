import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Dialog, Grid, safeObjectURL } from '@cms/components';
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
import React from 'react';

interface PhotoFormData {
  id: number;
  name: string;
  image: string | Blob | null;
}

const useSchemeForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('名称'),
    image: createImageUpload('图片'),
  },
});

export async function clientLoader() {
  return {
    photos: (await PhotosApi.getPhotos()) as PhotoCardData[],
  };
}

export default function Photos(props: Route.ComponentProps) {
  const [photos, setOptimisticPhotos, commitPhotos] = useOptimisticArray(
    props.loaderData.photos,
    (prev, data: PhotoFormData) => {
      const tempUrl = safeObjectURL(data.image);
      const tempPhoto: PhotoCardData = {
        id: data.id || -Date.now(),
        name: data.name,
        url: tempUrl,
        thumbnailUrl: tempUrl,
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

  const create = useSchemeForm({
    title: '新增照片',
    map: () => ({
      id: 0,
      name: '新照片',
      image: null,
    }),
    onSubmit: (data) => {
      React.startTransition(async () => {
        if (!(data.image instanceof Blob)) {
          return;
        }
        // 先添加到 optimisticState 中，等待服务器返回结果
        setOptimisticPhotos(data);

        try {
          const photo = await OssAction.createPhoto({
            name: data.name,
            image: data.image,
          });
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
    map: (data: PhotosApi.Photo) => ({
      id: data.id,
      name: data.name,
      image: data.thumbnailUrl,
    }),
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
    const confirm = await Dialog.confirm({
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
      operation={
        <Button variant="primary" onClick={create}>
          新增
        </Button>
      }
    >
      <Grid
        columns={5}
        items={photos}
        renderItem={(item) => (
          <PhotoCard data={item} onEdit={edit} onDelete={deletePhoto} />
        )}
      />
    </Workspace>
  );
}
