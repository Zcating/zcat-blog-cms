import { useNavigate } from 'react-router';
import { Grid, FormDialog, Button, Row } from '@cms/components';
import { AlbumsApi } from '@cms/api';
import { AlbumImageCard, createCheckbox, createInput, createSchemeForm, createTextArea } from '@cms/core';
import { useForm, type SubmitHandler } from 'react-hook-form';

import type { Route } from './+types/albums';
import React from 'react';

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
  const [albums, setAlbums] = React.useState(props.loaderData.albums);
  const navigate = useNavigate();

  const handleCreateClick = async () => {
    const data = await showAlbumDialog({
      title: '新增相册',
      initialValues: {
        name: '默认相册',
        description: '',
      },
    });
    if (!data) {
      return;
    }
    const result = await AlbumsApi.createPhotoAlbum(data);
    setAlbums([...albums, result]);
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
        <Button variant="primary" onClick={handleCreateClick}>
          新增相册
        </Button>
      </div>

      <Grid
        items={albums}
        cols={3}
        renderItem={(item) => (
          <AlbumItem item={item} onClickItem={handleClickAlbum} />
        )}
      />
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
      source={item.cover?.url ?? ''}
      title={item.name}
      content={item.description}
      onClick={() => onClickItem(item)}
    />
  );
}

const showAlbumDialog = createSchemeForm({
  name: createInput("相册名称"),
  description: createTextArea("相册描述"),
});
