import { LoadingOutlined } from '@ant-design/icons';
import type { AlbumsApi } from '@cms/api';
import { Button, Card } from '@cms/components';
import React from 'react';

export interface PhotoAlbumData extends AlbumsApi.PhotoAlbum {
  loading?: boolean;
}

interface AlbumImageCardProps {
  data: PhotoAlbumData;
  onEdit: (item: PhotoAlbumData) => void;
  onClickItem: (item: PhotoAlbumData) => void;
}

export function AlbumImageCard(props: AlbumImageCardProps) {
  const data = props.data;

  const handleEdit = () => {
    props.onEdit(data);
  };

  const handleDetail = () => {
    props.onClickItem(data);
  };

  return (
    <Card>
      <Card.Figure src={data.cover?.url} alt={data.name} />
      <Card.Body>
        <Card.Title>{data.name}</Card.Title>
        {data.description ? <p>{data.description}</p> : null}
        <Card.Actions className="flex justify-end">
          <Button variant="primary" onClick={handleEdit}>
            编辑
          </Button>
          <Button onClick={handleDetail}>查看详情</Button>
        </Card.Actions>
      </Card.Body>
      {props.data.loading && (
        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-white/50 cursor-wait">
          <LoadingOutlined className="text-2xl" />
        </div>
      )}
    </Card>
  );
}
