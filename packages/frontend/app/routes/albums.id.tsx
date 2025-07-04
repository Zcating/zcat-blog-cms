import { FormDialog, Grid, ImageUpload } from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi, PhotosApi } from '@cms/api';
import { AlbumImageCard, errorHandler } from '@cms/core';
import { useForm } from 'react-hook-form';

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  try {
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
  } catch (e) {
    return errorHandler(e);
  }
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
        cols={3}
        renderItem={(item) => <AlbumPhotoItem item={item} />}
      />
    </div>
  );
}

interface AlbumPhotoItemProps {
  item: AlbumsApi.Photo;
  onClickItem?: (item: AlbumsApi.Photo) => void;
}
function AlbumPhotoItem(props: AlbumPhotoItemProps) {
  const { item, onClickItem } = props;
  const handleClick = () => {
    onClickItem?.(item);
  };
  return (
    <AlbumImageCard source={item.url} title={item.name} onClick={handleClick} />
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
  const { register, handleSubmit, setValue } = useForm<CreatePhotoValues>({
    defaultValues: props.initialValues,
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit(props.onSubmit)}>
      <label className="floating-label">
        <span className="label-text">相册名称</span>
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="请输入相片名称"
          {...register('name')}
        />
      </label>
      <label className="floating-label">
        <span className="label-text">上传图片</span>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Pick a file</legend>
          <input
            type="file"
            className="file-input"
            onChange={(e) => setValue('image', e.target.files?.[0] ?? null)}
          />
          <label className="label">Max size 2MB</label>
        </fieldset>
      </label>

      <div className="flex gap-3">
        <button className="block btn btn-primary" type="submit">
          创建
        </button>
        <button className="block btn" type="button" onClick={props.onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}

const showPhotoDialog = FormDialog.create<CreatePhotoValues>(PhotoCreationForm);
