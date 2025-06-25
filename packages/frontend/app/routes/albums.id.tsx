import { Grid } from '@cms/components';
import type { Route } from './+types/albums.id';
import { AlbumsApi } from '@cms/api';
import { AlbumImageCard } from '@cms/modules';

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
  return (
    <div>
      <h1>相册详情</h1>

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
