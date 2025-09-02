import React from 'react';
import type { Route } from './+types/albums.id';

import { Button, Grid, useLoadingFn } from '@cms/components';
import { AlbumsApi, PhotosApi } from '@cms/api';
import {
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  PhotoCard,
  updateArray,
} from '@cms/core';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const id = Number(params.id);
  if (isNaN(id)) {
    throw new Error('Not Found');
  }

  const album = await AlbumsApi.getPhotoAlbum(id);
  if (!album) {
    throw new Error('Not Found');
  }

  const photos = await PhotosApi.getPhotos(id);

  return {
    album,
    albumPhotos: photos,
  };
}

export default function AlbumsId(props: Route.ComponentProps) {
  const { album, albumPhotos } = props.loaderData;
  const [coverId, setCoverId] = React.useState<number>(album?.cover?.id || 0);
  const [photos, setPhotos] = React.useState<PhotosApi.Photo[]>(albumPhotos);
  const addPhoto = useSchemeForm({
    title: '新增照片',
    map: () => ({
      id: 0,
      name: '',
      image: null,
      albumId: album.id,
    }),
    async onSubmit(data) {
      if (!data || !(data.image instanceof Blob)) {
        return;
      }

      const photo = await PhotosApi.createAlbumPhoto({
        name: data.name,
        albumId: data.albumId,
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
      });
      if (!photo) {
        return;
      }

      setPhotos(updateArray(photos, photo));
    },
  });

  const setCover = useLoadingFn(async (photo: PhotosApi.Photo) => {
    // selectPhotoDialog.show();
    await AlbumsApi.setPhotoAlbumCover({
      photoId: photo.id,
      albumId: album.id,
    });

    setCoverId(photo.id);
  });

  const hoverComponent = (photo: PhotosApi.Photo) => {
    const isCover = coverId === photo.id;
    return isCover ? (
      <Button variant="error" loading={setCover.loading}>
        取消封面
      </Button>
    ) : (
      <Button onClick={() => setCover(photo)} loading={setCover.loading}>
        设为封面
      </Button>
    );
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
          {/* <Button variant="neutral" onClick={setCover}>
            设为封面
          </Button> */}
        </div>
      </div>
      <Grid
        items={photos}
        cols={5}
        renderItem={(item) => (
          <PhotoCard
            data={item}
            onEdit={editPhoto}
            hoverComponent={hoverComponent(item)}
          />
        )}
      />
    </div>
  );
}

const useSchemeForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('照片名称'),
    image: createImageUpload('上传图片'),
    albumId: createConstNumber(),
  },
});
