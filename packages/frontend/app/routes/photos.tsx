import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Dialog, Grid } from '@cms/components';
import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  OssAction,
  PhotoCard,
  updateArray,
  Workspace,
} from '@cms/core';
import React from 'react';

export async function clientLoader() {
  return {
    photos: await PhotosApi.getPhotos(),
  };
}

export default function Photos(props: Route.ComponentProps) {
  const [photos, setPhotos] = React.useState<PhotosApi.Photo[]>(
    props.loaderData.photos,
  );

  const create = useSchemeForm({
    title: '新增照片',
    map: () => ({
      id: 0,
      name: '新照片',
      image: null,
    }),
    onSubmit: async (data) => {
      if (!(data.image instanceof Blob)) {
        return;
      }

      const tempId = -Date.now();
      const tempUrl = URL.createObjectURL(data.image);
      const tempPhoto: PhotosApi.Photo = {
        id: tempId,
        name: data.name,
        url: tempUrl,
        thumbnailUrl: tempUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setPhotos((prev) => [tempPhoto, ...prev]);

      try {
        const photo = await OssAction.createPhoto({
          name: data.name,
          image: data.image,
        });
        setPhotos((prev) => prev.map((p) => (p.id === tempId ? photo : p)));
      } catch (error) {
        setPhotos((prev) => prev.filter((p) => p.id !== tempId));
        console.error(error);
      }
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
      const photo = await OssAction.updatePhoto(data);
      if (!photo) {
        return;
      }

      setPhotos(updateArray(photos, photo));
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

    await PhotosApi.deletePhoto(data.id);
    setPhotos(photos.filter((item) => item.id !== data.id));
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

const useSchemeForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('名称'),
    image: createImageUpload('图片'),
  },
});
