import React from 'react';
import zod from 'zod';
import type { Route } from './+types/albums.id';

import { Button, Grid, useLoadingFn } from '@cms/components';
import { AlbumsApi, PhotosApi } from '@cms/api';
import {
  createCheckbox,
  createConstNumber,
  createImageUpload,
  createInput,
  createSchemaForm,
  createTextArea,
  PhotoCard,
  showPhotoSelector,
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

  const albumPhotos = await PhotosApi.getPhotos(id);

  const reminderPhotos = await PhotosApi.getEmptyAlbumPhotos();

  return {
    album,
    albumPhotos,
    reminderPhotos,
  };
}

export default function AlbumsId(props: Route.ComponentProps) {
  const { album, albumPhotos, reminderPhotos } = props.loaderData;
  const [photos, setPhotos] = React.useState<PhotosApi.Photo[]>(albumPhotos);

  const editAlbum = useAlbumForm({
    title: '编辑相册',
    map: (item: AlbumsApi.PhotoAlbumDetail) => ({
      id: item.id,
      name: item.name ?? '',
      description: item.description ?? '',
      available: item.available ?? false,
    }),
    async onSubmit(data) {
      await AlbumsApi.updatePhotoAlbum({
        id: data.id,
        name: data.name,
        description: data.description,
        available: data.available,
      });
    },
  });

  // 新增照片
  const addPhoto = usePhotoForm({
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

      // const photo = await PhotosApi.createAlbumPhoto({
      //   name: data.name,
      //   albumId: data.albumId,
      //   image: data.image,
      // });

      // setPhotos([photo, ...photos]);
    },
  });

  // 编辑照片
  const editPhoto = usePhotoForm({
    title: '编辑照片',
    map: (data: PhotosApi.Photo) => ({
      id: data.id,
      name: data.name,
      image: data.url,
      albumId: album.id,
      isCover: data.isCover || false,
    }),
    async onSubmit(data) {
      // const photo = await PhotosApi.updateAlbumPhoto({
      //   id: data.id,
      //   name: data.name,
      //   image: data.image,
      //   albumId: data.albumId,
      // });
      // if (!photo) {
      //   return;
      // }
      // setPhotos(updateArray(photos, photo));
    },
  });

  // 选择照片
  const selectPhoto = async () => {
    const selectedPhotos = await showPhotoSelector({
      photos: reminderPhotos.filter((photo) => photo.albumId !== album.id),
    });
    if (!selectedPhotos) {
      return;
    }

    await AlbumsApi.addPhotos({
      albumId: album.id,
      photoIds: selectedPhotos.map((photo) => photo.id),
    });
    setPhotos([...photos, ...selectedPhotos]);
  };

  const [coverId, setCoverId] = React.useState<number>(album?.coverId || 0);
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
          <Button variant="primary" onClick={() => editAlbum(album)}>
            编辑相册
          </Button>
          <Button variant="neutral" onClick={addPhoto}>
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

const usePhotoForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('照片名称'),
    image: createImageUpload('上传图片'),
    albumId: createConstNumber(),
  },
});

// 相册创建表单
const useAlbumForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('相册名称'),
    description: createTextArea('相册描述'),
    available: createCheckbox('发布相册'),
  },
  schema: zod.object({
    id: zod.number().int(),
    name: zod.string().min(1, '相册名称不能为空'),
    description: zod.string(),
    available: zod.boolean(),
  }),
});
