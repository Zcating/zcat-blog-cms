import { GalleryApi } from "@blog/apis";
import {
  Button,
  Card,
  Grid,
  IconPhoto,
  Image,
  ImagePreload,
  Skeleton,
  View,
  Waterfall,
} from "@blog/components";
import { useNavigate } from "react-router";
import type { Route } from "./+types/gallery";

export function meta() {
  return [{ title: "相册" }, { name: "description", content: "个人技术博客" }];
}

export async function loader() {
  const pagination = await GalleryApi.getGalleries({ page: 1 });
  return {
    pagination,
  };
}

export default function GalleryPage(props: Route.ComponentProps) {
  // const [open, setOpen] = React.useState(false);
  // const [selectedPhoto, setSelectedPhoto] = React.useState<GalleryApi.Photo>();
  const navigate = useNavigate();
  const pagination = props.loaderData.pagination;
  const handleClick = (value: GalleryApi.Gallery) => {
    navigate(`/gallery/${value.id}`);
    // setSelectedPhoto(value);
    // setOpen(true);
  };

  return (
    <View className="flex flex-row items-center justify-center">
      <View className="flex flex-col items-center gap-20 lg:w-3xl md:w-2xl">
        <div className="text-2xl font-bold">一些我拍的照片</div>
        <Waterfall
          columns={2}
          columnGap="xl"
          rowGap="2xl"
          data={pagination.data}
          renderItem={(gallery) => (
            <PhotoItem value={gallery} onClick={handleClick} />
          )}
        />
        <Button size="xl">SHOW MORE</Button>
      </View>
    </View>
  );
}

export function HydrateFallback() {
  return (
    <Grid
      cols={3}
      columnClassName="px-40"
      items={Array.from({ length: 9 }, (_, i) => i)}
      renderItem={() => <Skeleton className="w-full aspect-3/2 rounded-md" />}
    />
  );
}

interface PhotoItemProps {
  value: GalleryApi.Gallery;
  onClick: (value: GalleryApi.Gallery) => void;
}
function PhotoItem({ value, onClick }: PhotoItemProps) {
  const url = value.cover?.url;
  const click = () => onClick(value);
  return (
    <View className="flex flex-col items-center gap-4">
      <Card
        className="cursor-pointer !p-0 aspect-square overflow-hidden w-full"
        onClick={click}
      >
        <ImagePreload src={url} />
      </Card>
      <View className="text-3xl font-bold">{value.name}</View>
    </View>
  );
}
