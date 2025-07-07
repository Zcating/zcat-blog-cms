import { PhotosApi } from '@cms/api';
import type { Route } from './+types/photos';
import { Button, Card, Form, Grid, Input } from '@cms/components';
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

// export function PhotoForm(props: PhotoFormProps) {
//   const form = Form.useForm({
//     initialValues: {
//       name: '',

//       ...props.data
//     },
//     onSubmit: props.onSubmit,
//   });
//   return (
//     <Form form={form}>
//       <Form.Item form={form} name="name" label="">
//         <Input />
//       </Form.Item>
//       <Form.Item form={form} name="url" label="">
//         <Input />
//       </Form.Item>
//     </Form>
//   );
// }
