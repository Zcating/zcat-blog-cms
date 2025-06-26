import { Grid } from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi, PhotosApi } from '@cms/api';
import { AlbumImageCard } from '@cms/modules';
import { useForm, type SubmitHandler } from 'react-hook-form';

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
    await PhotosApi.createPhoto({
      albumId: album.id,
      name: '新照片',
      // image: ""
    });
  };
  return (
    <div>
      <h1>相册详情</h1>
      <button className="btn btn-primary" onClick={addPhoto}>
        添加照片
      </button>
      <div>
        <h2>{album.name}</h2>
        <p>{album.description}</p>
        <Grid
          items={album.photos}
          cols={3}
          renderItem={(item) => <AlbumPhotoItem item={item} />}
        />
      </div>
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

interface PhotoCreationFormProps {
  defaultValue: PhotosApi.CreatePhotoParams;
  onSubmit: (data: PhotosApi.CreatePhotoParams) => void;
  onCancel: () => void;
}
function PhotoCreationForm(props: PhotoCreationFormProps) {
  const { register, handleSubmit } = useForm<PhotosApi.CreatePhotoParams>({
    defaultValues: props.defaultValue,
  });

  const onSubmit: SubmitHandler<PhotosApi.CreatePhotoParams> = (data) => {
    props.onSubmit(data);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <label className="floating-label">
        <span className="label-text">相册名称</span>
        <input
          className="input input-bordered w-full"
          type="text"
          placeholder="请输入相册名称"
          {...register('name')}
        />
      </label>
      <label className="floating-label">
        <span className="label-text">相册描述</span>
        <textarea
          className="textarea w-full"
          placeholder="请输入相册描述"
          {...register('image')}
        />
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
