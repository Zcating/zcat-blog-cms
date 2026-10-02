// The loader is typed locally rather than against `Route.LoaderArgs`,
// which the router build plugin only emits into `routeTree.gen.ts`;
// the page MUST read a warm cache slot, so it never fetches itself.

import { createFileRoute } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import Photos from '@cms/features/photo/routes/photos';
import {
  coerceQueryInt,
  paginationSearchSchema,
} from '@cms/shared/hooks/use-pagination-action';
import type { PaginationSearch } from '@cms/shared/hooks/use-pagination-action';
import { photoListQueryOptions } from '@cms/server/photos';

interface PhotosLoaderArgs {
  search: PaginationSearch;
  context: { queryClient: QueryClient };
}

export async function loader({ search, context }: PhotosLoaderArgs) {
  const page = coerceQueryInt(search.page, 1);
  const pageSize = coerceQueryInt(search.pageSize, 20);
  const albumId = search.albumId;

  return context.queryClient.query({
    ...photoListQueryOptions({
      albumId,
      page,
      pageSize,
    }),
    staleTime: 'static',
  });
}

export const Route = createFileRoute('/_cms/photos')({
  validateSearch: paginationSearchSchema,
  loader: ({ context, location }) =>
    loader({ search: location.search, context }),
  component: PhotosListRoute,
});

function PhotosListRoute() {
  const search = Route.useSearch();
  return <Photos search={search} />;
}
