import type { PhotosApi } from '@cms/api';
import { Button, Card } from '@cms/components';

interface PhotoCardProps {
  data: PhotosApi.Photo;
  onEdit: (data: PhotosApi.Photo) => void;
}

export function PhotoCard(props: PhotoCardProps) {
  const srcUrl = `/static/${props.data.thumbnailUrl}`;
  return (
    <Card>
      <Card.Figure src={srcUrl} alt={props.data.name} />
      <Card.Body>
        <Card.Title>{props.data.name}</Card.Title>
        <Card.Actions>
          <Button onClick={() => props.onEdit(props.data)}>编辑</Button>
        </Card.Actions>
      </Card.Body>
    </Card>
  );
}
