import { GalleryApi } from "@blog/apis";
import {
  Button,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPointer,
  IconClose,
  View,
  type CarouselApi,
} from "@blog/components";
import type { Route } from "./+types/gallery.id";
import { PhotoPoster } from "@blog/modules";
import React from "react";
import { useNavigate } from "react-router";
import { Assets } from "@blog/assets";

export function meta() {
  return [{ title: "相册" }, { name: "description", content: "个人技术博客" }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const gallery = await GalleryApi.getGalleryDetail(params.id);
  return {
    gallery,
  };
}

export default function GalleryDetailPage(props: Route.ComponentProps) {
  const gallery = props.loaderData.gallery;
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length - 1);
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const navigate = useNavigate();
  const back = () => {
    navigate(`/gallery`);
  };

  return (
    <View
      className="h-screen overflow-hidden flex flex-row items-center justify-center"
      backgroundColor="oklch(0.3898 0.0523 28.3)"
    >
      <Carousel scrollbarable opts={{ duration: 20 }} setApi={setApi}>
        <CarouselContent>
          {gallery.cover && (
            <CarouselItem>
              <PhotoPoster.Cover
                name={gallery.name}
                description={gallery.description}
                photo={gallery.cover}
              />
            </CarouselItem>
          )}
          {gallery.photos.map((item) => (
            <CarouselItem key={item.id}>
              <PhotoPoster photo={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPointer />
      </Carousel>
      {current > 0 && (
        <View className="absolute bottom-0 left-0 right-0 flex items-center h-20">
          <View className="flex-1 text-center text-white">
            {gallery.photos[current - 1].name}
          </View>
          <View
            className="flex-1 text-white text-center text-3xl font-bold"
            style={{ fontFamily: "'Times New Roman'" }}
          >
            {current} / {count}
          </View>
          <View className="flex-1 flex justify-end items-center">
            <Button className="mr-12" onClick={back}>
              返回相册
            </Button>
          </View>
        </View>
      )}
      <Button className="absolute top-4 right-4" variant="link" onClick={back}>
        <IconClose color="white" />
      </Button>
    </View>
  );
}
