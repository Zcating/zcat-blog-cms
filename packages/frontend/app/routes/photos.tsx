import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Grid } from '@cms/components';
import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemeForm,
  PhotoCard,
  updateArray,
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

      const photo = await PhotosApi.createPhoto({
        name: data.name,
        image: data.image,
      });

      setPhotos([photo, ...photos]);
    },
  });

  const edit = useSchemeForm({
    title: '编辑照片',
    confirmText: '保存',
    cancelText: '取消',
    map: (data: PhotosApi.Photo) => ({
      id: data.id,
      name: data.name,
      image: data.url,
    }),
    onSubmit: async (data) => {
      const photo = await PhotosApi.updatePhoto(data);
      if (!photo) {
        return;
      }

      setPhotos(updateArray(photos, photo));
    },
  });

  return (
    <div className="space-y-5 p-3">
      <h1 className="text-2xl font-bold">照片</h1>
      <Button variant="primary" onClick={create}>
        新增
      </Button>
      <Grid
        cols={5}
        items={photos}
        renderItem={(item) => <PhotoCard data={item} onEdit={edit} />}
      />
    </div>
  );
}

const useSchemeForm = createSchemeForm({
  id: createConstNumber(),
  name: createInput('名称'),
  image: createImageUpload('图片'),
});
