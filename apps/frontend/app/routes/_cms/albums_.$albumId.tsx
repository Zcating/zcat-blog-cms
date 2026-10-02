// This route registers no `validateSearch`, so `search` reaches the
// loader raw and `coerceQueryInt` owns the coercion here. The loader is
// typed locally rather than against `Route.LoaderArgs`, which the router
// build plugin only emits into `routeTree.gen.ts`.

import { createFileRoute } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import { safeNumber } from '@zcat/ui';

import AlbumsId from '@cms/features/album/routes/albums.id';
import { coerceQueryInt } from '@cms/shared/hooks/use-pagination-action';
import { withNotFound } from '@cms/shared/routing/not-found';
import { photoAlbumDetailQueryOptions } from '@cms/server/albums';
import {
  emptyAlbumPhotosQueryOptions,
  photoListQueryOptions,
} from '@cms/server/photos';

interface AlbumDetailLoaderArgs {
  search: Record<string, unknown>;
  params: { albumId?: string };
  context: { queryClient: QueryClient };
}

export async function loader({
  search,
  params,
  context,
}: AlbumDetailLoaderArgs) {
  const page = coerceQueryInt(search.page, 1);
  const pageSize = coerceQueryInt(search.pageSize, 20);

  const albumId = safeNumber(params.albumId);
  if (Number.isNaN(albumId)) {
    throw new Error('Invalid album id');
  }

  return Promise.all([
    withNotFound(() =>
      context.queryClient.query({
        ...photoAlbumDetailQueryOptions({ id: albumId }),
        staleTime: 'static',
      }),
    ),
    context.queryClient.query({
      ...photoListQueryOptions({ albumId, page, pageSize }),
      staleTime: 'static',
    }),
    context.queryClient.query({
      ...emptyAlbumPhotosQueryOptions(),
      staleTime: 'static',
    }),
  ]);
}

export const Route = createFileRoute('/_cms/albums_/$albumId')({
  loader: ({ context, location, params }) =>
    loader({ search: location.search, params, context }),
  component: AlbumDetailRoute,
});

function AlbumDetailRoute() {
  const { albumId } = Route.useParams() as { albumId: string };
  const search = Route.useSearch() as Record<string, unknown>;
  return <AlbumsId albumId={Number(albumId)} search={search} />;
}
