import { Button, Grid } from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi, PhotosApi } from '@cms/api';
import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemeForm,
  createCheckbox,
  PhotoCard,
  updateArray,
} from '@cms/core';
import React from 'react';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error('Not Found');
  }

  const album = await AlbumsApi.getPhotoAlbum(id);
  if (!album) {
    throw new Error('Not Found');
  }

  return {
    album,
  };
}

export default function AlbumsId(props: Route.ComponentProps) {
  const { album } = props.loaderData;
  const [photos, setPhotos] = React.useState<PhotosApi.Photo[]>(album.photos);
  const addPhoto = useSchemeForm({
    title: '新增照片',
    map: () => ({
      id: 0,
      name: '',
      image: null,
      albumId: album.id,
      isCover: false,
    }),
    async onSubmit(data) {
      if (!data || !(data.image instanceof Blob)) {
        return;
      }

      const photo = await PhotosApi.createAlbumPhoto({
        name: data.name,
        albumId: data.albumId,
        isCover: data.isCover,
        image: data.image,
      });

      setPhotos([photo, ...photos]);
    },
  });

  const editPhoto = useSchemeForm({
    title: '编辑照片',
    map: (data: PhotosApi.Photo) => ({
      id: data.id,
      name: data.name,
      image: data.url,
      albumId: album.id,
      isCover: data.isCover || false,
    }),
    async onSubmit(data) {
      const photo = await PhotosApi.updateAlbumPhoto({
        id: data.id,
        name: data.name,
        image: data.image,
        albumId: data.albumId,
        isCover: data.isCover,
      });
      if (!photo) {
        return;
      }

      setPhotos(updateArray(photos, photo));
    },
  });

  const selectPhoto = () => {
    // selectPhotoDialog.show();
  };

  return (
    <div className="space-y-10 p-3">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">相册名称：{album.name}</h1>
        <p>{album.description}</p>
        <div className="flex gap-5">
          <Button variant="primary" onClick={addPhoto}>
            添加照片
          </Button>
          <Button variant="neutral" onClick={selectPhoto}>
            选择照片
          </Button>
        </div>
      </div>
      <Grid
        items={photos}
        cols={5}
        renderItem={(item) => <PhotoCard data={item} onEdit={editPhoto} />}
      />
    </div>
  );
}

const useSchemeForm = createSchemeForm({
  id: createConstNumber(),
  name: createInput('照片名称'),
  image: createImageUpload('上传图片'),
  albumId: createConstNumber(),
  isCover: createCheckbox('设为封面'),
});
