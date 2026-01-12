import { FullscreenOutlined, LoadingOutlined } from '@ant-design/icons';
import React from 'react';

import { Button, Card, Image, Modal, Row } from '@cms/components';

import type { PhotosApi } from '@cms/api';

export interface PhotoCardData extends PhotosApi.Photo {
  loading?: boolean;
}

interface PhotoCardProps {
  data: PhotoCardData;
  onEdit: (data: PhotosApi.Photo) => void;
  onDelete: (data: PhotosApi.Photo) => void;
  hoverComponent?: React.ReactNode;
}

export function PhotoCard(props: PhotoCardProps) {
  const srcUrl = props.data.thumbnailUrl;
  const [visible, setVisible] = React.useState(false);
  const hover = () => {
    setVisible(true);
  };

  const leave = () => {
    setVisible(false);
  };

  const fullscreen = async (photo: PhotosApi.Photo) => {
    await Modal.open({
      contentContainerClassName: 'max-w-3xl',
      children: <Image className="w-full" src={photo.url} alt={photo.name} />,
      backdropClose: true,
    });
  };

  return (
    <Card
      className="relative overflow-hidden"
      onMouseOver={hover}
      onMouseLeave={leave}
    >
      <Card.Figure src={srcUrl} alt={props.data.name} />
      <Card.Body>
        <Card.Title>{props.data.name}</Card.Title>
        <Card.Actions>
          <Button variant="primary" onClick={() => props.onEdit(props.data)}>
            编辑
          </Button>
          <Button variant="error" onClick={() => props.onDelete(props.data)}>
            删除
          </Button>
        </Card.Actions>
      </Card.Body>
      {visible && (
        <div className="absolute top-0 right-0 left-0">
          <Row justify="between">
            <Button
              variant="info"
              shape="square"
              size="sm"
              appearance="soft"
              onClick={() => fullscreen(props.data)}
            >
              <FullscreenOutlined className="text-xl" />
            </Button>
            {props.hoverComponent}
          </Row>
        </div>
      )}
      {props.data.loading && (
        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-white/50 cursor-wait">
          <LoadingOutlined className="text-2xl" />
        </div>
      )}
    </Card>
  );
}
