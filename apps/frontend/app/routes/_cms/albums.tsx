// The loader is typed locally rather than against `Route.LoaderArgs`,
// which the router build plugin only emits into `routeTree.gen.ts`;
// the page MUST read a warm cache slot, so it never fetches itself.

import { createFileRoute } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';

import Albums from '@cms/features/album/routes/albums';
import {
  coerceQueryInt,
  paginationSearchSchema,
} from '@cms/shared/hooks/use-pagination-action';
import type { PaginationSearch } from '@cms/shared/hooks/use-pagination-action';
import { photoAlbumsListQueryOptions } from '@cms/server/albums';

interface AlbumsListLoaderArgs {
  search: PaginationSearch;
  context: { queryClient: QueryClient };
}

export async function loader({ search, context }: AlbumsListLoaderArgs) {
  const page = coerceQueryInt(search.page, 1);
  const pageSize = coerceQueryInt(search.pageSize, 10);

  return context.queryClient.query({
    ...photoAlbumsListQueryOptions({ page, pageSize }),
    staleTime: 'static',
  });
}

export const Route = createFileRoute('/_cms/albums')({
  validateSearch: paginationSearchSchema,
  loader: ({ context, location }) =>
    loader({ search: location.search, context }),
  component: AlbumsListRoute,
});

function AlbumsListRoute() {
  const search = Route.useSearch();
  return <Albums search={search} />;
}
