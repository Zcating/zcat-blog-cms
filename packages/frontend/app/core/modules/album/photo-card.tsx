import type { PhotosApi } from '@cms/api';
import { Button, Card } from '@cms/components';
import React from 'react';

interface PhotoCardProps {
  data: PhotosApi.Photo;
  hoverComponent?: React.ReactNode;
  onEdit: (data: PhotosApi.Photo) => void;
}

export function PhotoCard(props: PhotoCardProps) {
  const srcUrl = props.data.thumbnailUrl;
  const [visible, setVisible] = React.useState(false);
  const hover = () => {
    if (!props.hoverComponent) {
      return;
    }
    setVisible(true);
  };

  const leave = () => {
    if (!props.hoverComponent) {
      return;
    }
    setVisible(false);
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
        <div className="absolute top-0 right-0">{props.hoverComponent}</div>
      )}
    </Card>
  );
}
