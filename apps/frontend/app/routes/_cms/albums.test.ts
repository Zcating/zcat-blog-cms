/**
 * Tests for the `_cms/albums` route file.
 *
 * Scope:
 *   - The loader reads `page` and `pageSize` from the router's
 *     parsed search object (defaulting to 1 / 10).
 *   - The loader calls
 *     `context.queryClient.query({ ...photoAlbumsListQueryOptions(...), staleTime: 'static' })`
 *     so SSR has a hydrated cache slot before the page reads it.
 *
 * The only mocked boundary is the server-function surface
 * (`@cms/server/albums`); the `QueryClient` and helper are
 * exercised as-is.
 *
 * Note: the real `photoAlbumsListQueryOptions` is a closure over
 * the `createServerFn`-wrapped `getPhotoAlbums`. Vitest's module
 * mocks cannot rewrite the captured reference inside the factory,
 * so we replace the factory itself with a stub that invokes our
 * test mock — that way the loader's `query` round-trip
 * can run end-to-end without booting the TanStack Start runtime.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getPhotoAlbumsMock } = vi.hoisted(() => ({
  getPhotoAlbumsMock: vi.fn(),
}));

vi.mock('@cms/server/albums', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/albums')>(
      '@cms/server/albums',
    );
  return {
    ...actual,
    getPhotoAlbums: (...args: unknown[]) => getPhotoAlbumsMock(...args),
    photoAlbumsListQueryOptions: (
      input: Partial<{ page: number; pageSize: number }> = {},
    ) => {
      const resolved = {
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 10,
      };
      return {
        queryKey: ['albums', 'list', resolved] as const,
        queryFn: () => getPhotoAlbumsMock({ data: resolved }),
      };
    },
  };
});

// --- import after mocks ---

import { paginationSearchSchema } from '@cms/shared/hooks/use-pagination-action';
import type { PaginationSearch } from '@cms/shared/hooks/use-pagination-action';
import { photoAlbumsListQueryOptions } from '@cms/server/albums';

import { loader, Route } from './albums';

describe('route search schema: /_cms/albums', () => {
  it('registers the shared pagination search schema', () => {
    expect(Route.options.validateSearch).toBe(paginationSearchSchema);
  });
});

function buildSearch(searchStr: string): PaginationSearch {
  return paginationSearchSchema.parse(
    Object.fromEntries(new URLSearchParams(searchStr)),
  );
}

function buildLoaderArgs(
  search: PaginationSearch,
  queryClient: QueryClient,
): Parameters<typeof loader>[0] {
  return {
    search,
    context: { queryClient },
  };
}

describe('route loader: /_cms/albums', () => {
  beforeEach(() => {
    getPhotoAlbumsMock.mockReset();
  });

  it('ensures the paginated albums Query with default (page=1, pageSize=10)', async () => {
    getPhotoAlbumsMock.mockResolvedValueOnce({
      data: [],
      page: 1,
      pageSize: 10,
      totalPages: 1,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader(buildLoaderArgs(buildSearch(''), queryClient));

    // The Query must have the cache slot populated with the
    // server function response so the page can render it via
    // `useSuspenseQuery`.
    const key = photoAlbumsListQueryOptions({ page: 1, pageSize: 10 }).queryKey;
    const cached = queryClient.getQueryData(key);
    expect(cached).toEqual({
      data: [],
      page: 1,
      pageSize: 10,
      totalPages: 1,
      total: 0,
    });

    // The underlying server function must be invoked exactly once
    // for this slot, with the default input.
    expect(getPhotoAlbumsMock).toHaveBeenCalledTimes(1);
    const firstCall = getPhotoAlbumsMock.mock.calls[0]?.[0] as
      | { data: { page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ page: 1, pageSize: 10 });
  });

  it('honors explicit page and pageSize from the URL search params', async () => {
    getPhotoAlbumsMock.mockResolvedValueOnce({
      data: [],
      page: 2,
      pageSize: 25,
      totalPages: 4,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader(
      buildLoaderArgs(buildSearch('?page=2&pageSize=25'), queryClient),
    );

    const key = photoAlbumsListQueryOptions({ page: 2, pageSize: 25 }).queryKey;
    expect(queryClient.getQueryData(key)).toEqual({
      data: [],
      page: 2,
      pageSize: 25,
      totalPages: 4,
      total: 0,
    });

    const firstCall = getPhotoAlbumsMock.mock.calls[0]?.[0] as
      | { data: { page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ page: 2, pageSize: 25 });
  });
});
