import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Card, Grid } from '@cms/components';
import { PhotoCard } from '@cms/core';

export async function clientLoader() {
  return {
    photos: await PhotosApi.getPhotos(),
  };
}

export default function Photos(props: Route.ComponentProps) {
  const { photos } = props.loaderData;
  const create = async () => {
    // TODO: show form
  };

  const edit = (data: PhotosApi.Photo) => {
    // TODO: show form
  };

  return (
    <div className="space-y-5 p-3">
      <h1 className="text-2xl font-bold">照片</h1>
      <Button variant="primary" onClick={create}>
        新增
      </Button>
      <Grid
        cols={5}
        items={photos}
        renderItem={(item) => <PhotoCard data={item} onEdit={edit} />}
      />
    </div>
  );
}

interface PhotoFormProps {
  data?: PhotosApi.Photo;
  onSubmit: (data: PhotosApi.Photo) => void;
}

export function PhotoForm(props: PhotoFormProps) {
  return (
    <form>
      <input name="name" defaultValue={props.data?.name} />
      <input name="url" defaultValue={props.data?.url} />
    </form>
  );
}
