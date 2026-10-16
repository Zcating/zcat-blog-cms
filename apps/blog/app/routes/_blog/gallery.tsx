import { Skeleton, ZGrid } from '@zcat/ui';
import { createFileRoute } from '@tanstack/react-router';

import { loadPaginatedList, pageParamSchema } from '@blog/common';
import { GalleryPage } from '@blog/features';
import { getGalleryList } from '@blog/server/gallery';

interface GalleryLoaderArgs {
  search: { page?: string | number };
}

export async function loader({ search }: GalleryLoaderArgs) {
  return loadPaginatedList({
    to: '/gallery',
    search,
    fetch: (page) => getGalleryList({ data: { page } }),
  });
}

export const Route = createFileRoute('/_blog/gallery')({
  validateSearch: pageParamSchema,
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
