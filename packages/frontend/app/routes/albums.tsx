import { useNavigate } from 'react-router';
import { Grid, Modal, FormDialog } from '@cms/components';
import { AlbumsApi } from '@cms/api';
import { AlbumImageCard } from '@cms/modules';
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
      defaultValue: {
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
        <button className="btn btn-primary" onClick={handleCreateClick}>
          新增相册
        </button>
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

interface AlbumCreationFormProps {
  defaultValue: AlbumsApi.PhotoAlbum;
  onSubmit: (data: AlbumsApi.PhotoAlbum) => void;
  onCancel: () => void;
}
function AlbumCreationForm(props: AlbumCreationFormProps) {
  const { register, handleSubmit } = useForm<AlbumsApi.PhotoAlbum>({
    defaultValues: props.defaultValue,
  });

  const onSubmit: SubmitHandler<AlbumsApi.PhotoAlbum> = (data) => {
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
          {...register('description')}
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

const showAlbumDialog =
  FormDialog.create<AlbumsApi.PhotoAlbum>(AlbumCreationForm);
