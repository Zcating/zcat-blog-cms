import { Form, FormDialog, Grid, ImageUpload } from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi, PhotosApi } from '@cms/api';
import { PhotoCard } from '@cms/core';

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

  const edit = () => {};
  return (
    <div className="space-y-10 p-3">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">相册名称：{album.name}</h1>
        <p>{album.description}</p>
        <button className="btn btn-primary" onClick={addPhoto}>
          添加照片
        </button>
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
    <Form form={instance}>
      <Form.Item form={instance} label="照片名称" name="name">
        <input type="text" />
      </Form.Item>
      <Form.Item form={instance} label="上传图片" name="image">
        <ImageUpload />
      </Form.Item>
      <div className="flex gap-3">
        <button className="block btn btn-primary" type="submit">
          创建
        </button>
        <button className="block btn" type="button" onClick={props.onCancel}>
          取消
        </button>
      </div>
    </Form>
  );
}

const showPhotoDialog = FormDialog.create<CreatePhotoValues>(PhotoCreationForm);
