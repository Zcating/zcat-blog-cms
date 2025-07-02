import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Card, Grid } from '@cms/components';

export async function clientLoader() {
  return {
    photos: await PhotosApi.getPhotos(),
  };
}

export default function Photos(props: Route.ComponentProps) {
  const { photos } = props.loaderData;

  return (
    <div>
      <h1>照片列表</h1>
      <Grid
        items={photos}
        cols={3}
        renderItem={(item) => <PhotoItem item={item} />}
      />
    </div>
  );
}

function PhotoItem(props: { item: PhotosApi.Photo }) {
  const { item } = props;
  return (
    <Card>
      <figure>
        <img src={`/static/${item.thumbnailUrl}`} alt={item.name} />
      </figure>
      <Card.Body>
        <Card.Title>{item.name}</Card.Title>
        <Card.Actions>
          <Button variant="primary">查看详情</Button>
        </Card.Actions>
      </Card.Body>
    </Card>
  );
}
