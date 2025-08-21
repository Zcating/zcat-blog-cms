import type { GalleryApi } from "@blog/apis";
import { AspectRatio, Image, View } from "@blog/components";

interface PhotoPosterProps {
  photo: GalleryApi.Photo;
}
export function PhotoPoster(props: PhotoPosterProps) {
  const { photo } = props;
  return (
    <View className="w-full h-full flex items-center justify-center">
      <View className="flex items-center justify-center">
        <Image
          contentMode="cover"
          className="max-h-[80vh]"
          src={photo.url}
          alt={photo.name}
        />
      </View>
    </View>
  );
}

interface PhotoPosterCoverProps {
  photo: GalleryApi.Photo;
  name: string;
  description: string;
}

PhotoPoster.Cover = function Cover(props: PhotoPosterCoverProps) {
  const { photo, name, description } = props;
  return (
    <View className="w-full h-full flex flex-col items-center justify-center gap-20">
      <Image
        className="w-xl h-xl aspect-square"
        src={photo.url}
        alt={photo.name}
      />
      <View className="w-full flex flex-col items-center justify-center gap-5">
        <View className="text-white text-5xl font-bold">{name}</View>
        <View className="text-white text-2xl">{description}</View>
      </View>
    </View>
  );
};
