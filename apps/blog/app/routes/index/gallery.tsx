import {
  Button,
  Card,
  ZGrid,
  ZImagePreload,
  Skeleton,
  StaggerReveal,
  ZView,
  ZWaterfall,
} from '@zcat/ui';
import { useNavigate } from 'react-router';

import { GalleryApi } from '@blog/apis';

import type { Route } from '../+types/gallery';

export function meta() {
  return [{ title: '相册' }, { name: 'description', content: '个人技术博客' }];
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
    <ZView className="flex flex-row items-center justify-center">
      <ZView className="w-full flex flex-col items-center gap-20 px-4 md:px-10 lg:px-20">
        <StaggerReveal selector="[data-gallery-title='true']" direction="top">
          <ZView className="text-2xl font-bold" data-gallery-title="true">
            一些我拍的照片
          </ZView>
        </StaggerReveal>
        <StaggerReveal
          className="w-full h-full flex flex-col items-center gap-10"
          selector="[data-gallery-item='true']"
          direction="bottom"
          dependencies={[pagination.data]}
        >
          <ZWaterfall
            data-gallery-item="true"
            columns={3}
            data={pagination.data}
            renderItem={(gallery) => (
              <PhotoItem value={gallery} onClick={handleClick} />
            )}
          />
          <Button data-gallery-item="true" size="xl">
            SHOW MORE
          </Button>
        </StaggerReveal>
      </ZView>
    </ZView>
  );
}

export function HydrateFallback() {
  return (
    <ZGrid
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
    <ZView className="flex-1 flex flex-col items-center gap-4">
      <Card
        className="group relative cursor-pointer p-0! overflow-hidden w-full"
        onClick={click}
      >
        <ZImagePreload src={url} />
        <ZView className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <ZView className="text-3xl font-bold text-white translate-y-10 transition-transform duration-300 group-hover:translate-y-0 text-center px-4">
            {value.name}
          </ZView>
        </ZView>
      </Card>
    </ZView>
  );
}
