import {
  Card,
  Skeleton,
  StaggerReveal,
  ZGrid,
  ZImagePreload,
  ZPagination,
  ZView,
  ZWaterfall,
} from '@zcat/ui';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

import { safePositiveNumber } from '@blog/common';
import { getGalleryList } from '@blog/server/gallery';

import type { Gallery } from '@blog/server/gallery/schemas';

const gallerySearchSchema = z.looseObject({
  page: z.coerce.number().int().positive().optional(),
});

type GallerySearch = z.infer<typeof gallerySearchSchema>;

interface GalleryLoaderArgs {
  search: { page?: string | number };
}

export async function loader({ search }: GalleryLoaderArgs) {
  const requestedPage = safePositiveNumber(search.page, 1);
  const pagination = await getGalleryList({ data: { page: requestedPage } });
  const page = Math.min(requestedPage, Math.max(1, pagination.totalPages));
  return { pagination, page };
}

export const Route = createFileRoute('/_blog/gallery')({
  validateSearch: gallerySearchSchema,
  head: () => ({
    meta: [{ title: '相册' }, { name: 'description', content: '个人技术博客' }],
  }),
  loader: ({ location }) => loader({ search: location.search }),
  component: GalleryPage,
  pendingComponent: GalleryPendingFallback,
});

function GalleryPendingFallback() {
  return (
    <ZGrid
      cols={3}
      columnClassName="px-40"
      items={Array.from({ length: 9 }, (_, index) => index)}
      renderItem={() => <Skeleton className="w-full aspect-3/2 rounded-md" />}
    />
  );
}

function GalleryPage() {
  const navigate = useNavigate();
  const { pagination, page } = Route.useLoaderData();

  const handleClick = (value: Gallery) => {
    navigate({ to: '/gallery/$id', params: { id: String(value.id) } });
  };

  const goToPage = (nextPage: number) => {
    navigate({ to: '/gallery', search: { page: String(nextPage) } });
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
            columnCountConfig={{ sm: 2, lg: 3 }}
            columnCount={4}
            data={pagination.data}
            renderItem={(gallery) => (
              <PhotoItem value={gallery} onClick={handleClick} />
            )}
          />
        </StaggerReveal>
        {pagination.totalPages > 1 && (
          <ZPagination
            page={page}
            totalPages={pagination.totalPages}
            onPageChange={goToPage}
          />
        )}
      </ZView>
    </ZView>
  );
}

interface PhotoItemProps {
  value: Gallery;
  onClick: (value: Gallery) => void;
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
