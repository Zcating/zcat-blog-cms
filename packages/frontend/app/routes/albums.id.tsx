import {
  Button,
  Form,
  FormDialog,
  Grid,
  ImageUpload,
  Input,
  Row,
} from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi, PhotosApi } from '@cms/api';
import {
  createEmptyNumber,
  createImageUpload,
  createInput,
  createSchemeForm,
  PhotoCard,
} from '@cms/core';

import * as z from 'zod/v4';

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
  const addPhoto = async () => {
    const params = await showPhotoDialog({
      title: '新增照片',
      initialValues: {
        name: '新照片',
        albumId: album.id,
        image: null,
      },
    });

    if (!params || !(params.image instanceof Blob)) {
      return;
    }

    await PhotosApi.createPhoto({
      name: params.name,
      albumId: params.albumId,
      image: params.image,
    });
  };

  const selectPhoto = async () => {
    const params = await showPhotoDialog({
      title: '选择照片',
      confirmText: '选择',
      cancelText: '取消',
      initialValues: {
        name: '新照片',
        albumId: album.id,
        image: null,
      },
    });
  };

  const edit = async (photo: PhotosApi.Photo) => {
    const params = await showPhotoDialog({
      title: '编辑照片',
      confirmText: '确认',
      cancelText: '取消',
      initialValues: {
        name: photo.name,
        albumId: album.id,
        image: photo.url,
      },
    });
    console.log(params);
    // const params = await showPhotoDialog({
    //   title: '编辑照片',
    //   imageUrl: photo.imageUrl,
    //   initialValues: {
    //     name: photo.name,
    //     albumId: album.id,
    //     image: null,
    //   },
    // });
    // if (!params || !params.image) {
    //   return;
    // }
    // await PhotosApi.createPhoto({
    //   name: params.name,
    //   albumId: params.albumId,
    //   image: params.image,
    // });
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
        items={album.photos}
        cols={5}
        renderItem={(item) => <PhotoCard data={item} onEdit={edit} />}
      />
    </div>
  );
}

const showPhotoDialog = createSchemeForm({
  name: createInput('照片名称'),
  image: createImageUpload('上传图片'),
  albumId: createEmptyNumber(),
});

// const showPhotoDialog = FormDialog.create<CreatePhotoValues>(PhotoCreationForm);
