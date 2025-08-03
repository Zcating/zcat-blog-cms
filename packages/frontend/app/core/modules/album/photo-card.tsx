import { FullscreenOutlined } from '@ant-design/icons';
import type { PhotosApi } from '@cms/api';
import { Button, Card, Image, Modal, Row } from '@cms/components';
import React from 'react';

interface PhotoCardProps {
  data: PhotosApi.Photo;
  onEdit: (data: PhotosApi.Photo) => void;
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

  const fullscreen = (photo: PhotosApi.Photo) => {
    Modal.open({
      contentContainerClassName: 'max-w-3xl',
      children: <Image className="w-full" src={photo.url} alt={photo.name} />,
      backdropClose: true,
    });
  };

  return (
    <Card className="relative" onMouseOver={hover} onMouseLeave={leave}>
      <Card.Figure src={srcUrl} alt={props.data.name} />
      <Card.Body>
        <Card.Title>{props.data.name}</Card.Title>
        <Card.Actions>
          <Button onClick={() => props.onEdit(props.data)}>编辑</Button>
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
    </Card>
  );
}
