import { useNavigate } from 'react-router';
import { Grid } from '@cms/components';
import { AlbumsApi } from '@cms/api';
import { AlbumImageCard } from '@cms/modules';

import type { Route } from './+types/albums';
import { Dialog } from '@cms/components/ui/dialog';

export async function clientLoader() {
  return {
    albums: await AlbumsApi.getPhotoAlbums(),
  };
}

/**
 * 相册页面
 * @param {Route.ComponentProps} props
 * @returns
 */
export default function Albums(props: Route.ComponentProps) {
  const navigate = useNavigate();

  const handleCreateClick = () => {
    Dialog.show();
  };

  const handleCloseDialog = () => {
    // setIsDialogOpen(false);
  };

  const handleCreateAlbum = async (data: {
    name: string;
    description: string;
  }) => {
    try {
      await AlbumsApi.createPhotoAlbum({
        name: data.name,
        description: data.description,
      });

      // 可以在这里刷新相册列表或导航到新创建的相册
    } catch (error) {
      alert('创建相册失败，请重试');
      throw error; // 重新抛出错误，让对话框组件处理
    }
  };

  const handleClickAlbum = (item: AlbumsApi.PhotoAlbum) => {
    navigate(`/albums/${item.id}`);
  };

  return (
    <div className="space-y-3 p-3">
      <h1>相册列表</h1>
      <div>
        <button className="btn btn-primary" onClick={handleCreateClick}>
          新增相册
        </button>
      </div>

      <Grid
        items={props.loaderData.albums}
        cols={3}
        renderItem={(item) => (
          <AlbumItem item={item} onClickItem={handleClickAlbum} />
        )}
      />

      {/* 新增相册对话框 */}
      {/* <CreateAlbumDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onSubmit={handleCreateAlbum}
      /> */}
    </div>
  );
}

interface AlbumItemProps {
  item: AlbumsApi.PhotoAlbum;
  onClickItem: (item: AlbumsApi.PhotoAlbum) => void;
}
function AlbumItem(props: AlbumItemProps) {
  const { item, onClickItem } = props;
  return (
    <AlbumImageCard
      source={
        item.cover?.url ??
        'https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp'
      }
      title={item.name}
      content={item.description}
      onClick={() => onClickItem(item)}
    />
  );
}
