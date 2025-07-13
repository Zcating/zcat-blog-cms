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
import { PhotoCard } from '@cms/core';

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
      title: '添加照片',
      initialValues: {
        name: '新照片',
        albumId: album.id,
        image: null,
      },
    });

    if (!params || !params.image) {
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
      initialValues: {
        name: '新照片',
        albumId: album.id,
        image: null,
      },
    });
  };

  const edit = async (photo: PhotosApi.Photo) => {
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

interface CreatePhotoValues {
  name: string;
  albumId: number;
  image: File | null;
}

interface PhotoCreationFormProps {
  imageUrl?: string;
  initialValues: CreatePhotoValues;
  onSubmit: (data: CreatePhotoValues) => void;
  onCancel: () => void;
}

/**
 * 照片创建表单
 * @param {PhotoCreationFormProps} props
 * @returns {React.ReactElement}
 */
function PhotoCreationForm(props: PhotoCreationFormProps): React.ReactElement {
  const instance = Form.useForm({
    initialValues: props.initialValues,
    onSubmit: props.onSubmit,
  });

  return (
    <Form form={instance} className="space-y-5">
      <Form.Item form={instance} label="照片名称" name="name">
        <Input />
      </Form.Item>
      <Form.Item form={instance} label="上传图片" name="image">
        <ImageUpload imageUrl={props.imageUrl} />
      </Form.Item>
      <Row gap="3" justify="end">
        <Button variant="primary" type="submit">
          创建
        </Button>
        <Button onClick={props.onCancel}>取消</Button>
      </Row>
    </Form>
  );
}

const showPhotoDialog = FormDialog.create<CreatePhotoValues>(PhotoCreationForm);
