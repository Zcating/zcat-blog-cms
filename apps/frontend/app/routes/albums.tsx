import { ZButton, ZGrid } from '@zcat/ui';
import React from 'react';
import { useNavigate } from 'react-router';
import zod from 'zod';

import { AlbumsApi } from '@cms/api';
import {
  AlbumImageCard,
  createCheckbox,
  createConstNumber,
  createInput,
  createSchemaForm,
  createTextArea,
  useOptimisticArray,
  Workspace,
  type PhotoAlbumData,
} from '@cms/core';

import type { Route } from './+types/albums';

interface AlbumFormValues {
  id: number;
  name: string;
  available: boolean;
  description: string;
}

export async function clientLoader() {
  return {
    albums: (await AlbumsApi.getPhotoAlbums()) as PhotoAlbumData[],
  };
}

/**
 * 相册页面
 * @param {Route.ComponentProps} props
 * @returns
 */
export default function Albums(props: Route.ComponentProps) {
  const [albums, setOptimisticAlbums, commitAlbums] = useOptimisticArray(
    props.loaderData.albums,
    (state, values: AlbumFormValues) => {
      if (values.id !== 0) {
        return state.map((album) => {
          if (album.id === values.id) {
            return {
              ...album,
              name: values.name,
              available: values.available,
              description: values.description,
              loading: true,
            };
          }
          return album;
        });
      }

      return [
        ...state,
        {
          id: -Date.now(),
          name: values.name,
          available: values.available,
          description: values.description,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          loading: true,
        },
      ];
    },
  );
  const navigate = useNavigate();

  const create = useAlbumForm({
    title: '新增相册',
    onSubmit: async (data) => {
      React.startTransition(async () => {
        setOptimisticAlbums(data);
        try {
          const result = await AlbumsApi.createPhotoAlbum(data);
          if (!result) {
            commitAlbums('rollback');
            return;
          }
          commitAlbums('update', result);
        } catch (error) {
          commitAlbums('rollback');
        }
      });
    },
  });

  const edit = useAlbumForm({
    title: '编辑相册',
    confirmText: '保存',
    onSubmit: async (data) => {
      React.startTransition(async () => {
        setOptimisticAlbums(data);
        try {
          const result = await AlbumsApi.updatePhotoAlbum(data);
          if (!result) {
            commitAlbums('rollback');
            return;
          }
          commitAlbums('update', result);
        } catch (error) {
          commitAlbums('rollback');
        }
      });
    },
  });

  const handleClickAlbum = (item: AlbumsApi.PhotoAlbum) => {
    navigate(`/albums/${item.id}`);
  };

  return (
    <Workspace
      title="相册列表"
      operation={
        <ZButton
          onClick={() => {
            create({
              id: 0,
              name: '默认相册',
              available: false,
              description: '',
            });
          }}
        >
          新增相册
        </ZButton>
      }
    >
      <ZGrid
        items={albums}
        cols={3}
        columnClassName="px-0"
        renderItem={(item) => (
          <AlbumImageCard
            data={item}
            onClickItem={handleClickAlbum}
            onEdit={edit}
          />
        )}
      />
    </Workspace>
  );
}

// 相册创建表单
const useAlbumForm = createSchemaForm({
  fields: {
    id: createConstNumber(),
    name: createInput('相册名称'),
    description: createTextArea('相册描述'),
    available: createCheckbox('发布相册'),
  },
  schema: zod.object({
    id: zod.number().int().default(0),
    name: zod.string().min(1, '相册名称不能为空').default(''),
    description: zod.string().default(''),
    available: zod.boolean().default(false),
  }),
});
