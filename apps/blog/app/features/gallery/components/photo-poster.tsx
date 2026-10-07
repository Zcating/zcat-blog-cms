import { ZImage, ZView } from '@zcat/ui';

import type { Photo } from '@blog/server/gallery/schemas';

interface PhotoPosterProps {
  photo: Photo;
}
export function PhotoPoster(props: PhotoPosterProps) {
  const { photo } = props;
  return (
    <ZView className="w-full h-full flex items-center justify-center">
      <ZView className="flex items-center justify-center">
        <ZImage
          contentMode="cover"
          className="max-h-[80vh]"
          src={photo.signedUrl}
          alt={photo.name}
        />
      </ZView>
    </ZView>
  );
}

interface PhotoPosterCoverProps {
  photo: Photo;
  name: string;
  description: string;
}

PhotoPoster.Cover = function Cover(props: PhotoPosterCoverProps) {
  const { photo, name, description } = props;
  return (
    <ZView className="w-full h-full flex flex-col items-center justify-center gap-20">
      <ZImage
        className="w-xl h-xl aspect-square"
        src={photo.signedThumbnailUrl}
        alt={photo.name}
      />
      <ZView className="w-full flex flex-col items-center justify-center gap-5">
        <ZView className="text-white text-5xl font-bold">{name}</ZView>
        <ZView className="text-white text-2xl">{description}</ZView>
      </ZView>
    </ZView>
  );
};
