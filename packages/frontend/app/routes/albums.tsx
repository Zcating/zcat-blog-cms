import { useNavigate } from 'react-router';
import { Grid, FormDialog, Button, Row } from '@cms/components';
import { AlbumsApi } from '@cms/api';
import {
  AlbumImageCard,
  createCheckbox,
  createConstNumber,
  createInput,
  createSchemeForm,
  createTextArea,
} from '@cms/core';
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

  const create = useAlbumForm({
    title: '新增相册',
    map() {
      return {
        id: 0,
        name: '默认相册',
        description: '',
      };
    },
    onSubmit: async (data) => {
      const result = await AlbumsApi.createPhotoAlbum(data);
      setAlbums([result, ...albums]);
    },
  });

  const edit = useAlbumForm({
    title: '编辑相册',
    map(item: AlbumsApi.PhotoAlbum) {
      return {
        id: item.id,
        name: item.name ?? '',
        description: item.description ?? '',
      };
    },
    onSubmit: async (data) => {
      const result = await AlbumsApi.updatePhotoAlbum(data.id, data);
      setAlbums(albums.map((album) => (album.id === data.id ? result : album)));
    },
  });

  const handleClickAlbum = (item: AlbumsApi.PhotoAlbum) => {
    navigate(`/albums/${item.id}`);
  };

  return (
    <div className="space-y-3 p-3">
      <h1>相册列表</h1>
      <div>
        <Button variant="primary" onClick={create}>
          新增相册
        </Button>
      </div>

      <Grid
        items={albums}
        cols={3}
        renderItem={(item) => (
          <AlbumItem item={item} onClickItem={handleClickAlbum} onEdit={edit} />
        )}
      />
    </div>
  );
}

interface AlbumItemProps {
  item: AlbumsApi.PhotoAlbum;
  onEdit: (item: AlbumsApi.PhotoAlbum) => void;
  onClickItem: (item: AlbumsApi.PhotoAlbum) => void;
}

function AlbumItem(props: AlbumItemProps) {
  const { item, onClickItem, onEdit } = props;
  return (
    <AlbumImageCard
      source={item.cover?.url ?? ''}
      title={item.name}
      content={item.description}
      onClick={() => onClickItem(item)}
      onEdit={() => onEdit(item)}
    />
  );
}

const useAlbumForm = createSchemeForm({
  id: createConstNumber(),
  name: createInput('相册名称'),
  description: createTextArea('相册描述'),
});
