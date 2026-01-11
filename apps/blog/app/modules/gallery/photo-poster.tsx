import type { GalleryApi } from "@blog/apis";
import { ZImage, ZView } from "@zcat/ui";

interface PhotoPosterProps {
  photo: GalleryApi.Photo;
}
export function PhotoPoster(props: PhotoPosterProps) {
  const { photo } = props;
  return (
    <ZView className="w-full h-full flex items-center justify-center">
      <ZView className="flex items-center justify-center">
        <ZImage
          contentMode="cover"
          className="max-h-[80vh]"
          src={photo.url}
          alt={photo.name}
        />
      </ZView>
    </ZView>
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
    <ZView className="w-full h-full flex flex-col items-center justify-center gap-20">
      <ZImage
        className="w-xl h-xl aspect-square"
        src={photo.url}
        alt={photo.name}
      />
      <ZView className="w-full flex flex-col items-center justify-center gap-5">
        <ZView className="text-white text-5xl font-bold">{name}</ZView>
        <ZView className="text-white text-2xl">{description}</ZView>
      </ZView>
    </ZView>
  );
};
