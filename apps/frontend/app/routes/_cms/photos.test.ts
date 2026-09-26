/**
 * Tests for the `_cms/photos` route file.
 *
 * Scope:
 *   - The loader reads `page` and `pageSize` from the router's
 *     parsed `location.search` (defaulting to 1 / 20).
 *   - The loader honours an optional `albumId` filter from that
 *     same search object.
 *   - The loader calls
 *     `context.queryClient.query({ ...photoListQueryOptions(...), staleTime: 'static' })`
 *     so SSR has a hydrated cache slot before the page reads it.
 *
 * The only mocked boundary is the server-function surface
 * (`@cms/server/photos`); the `QueryClient` and helper are
 * exercised as-is.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { photoListQueryOptions } from '@cms/server/photos';
import type { GetPhotosInput } from '@cms/server/photos/schemas';

const { getPhotosMock } = vi.hoisted(() => ({
  getPhotosMock: vi.fn(),
}));

vi.mock('@cms/server/photos', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/photos')>(
      '@cms/server/photos',
    );
  const schemas = await vi.importActual<
    typeof import('@cms/server/photos/schemas')
  >('@cms/server/photos/schemas');
  const query = await vi.importActual<typeof import('@tanstack/react-query')>(
    '@tanstack/react-query',
  );
  // Replace `getPhotos` with the mock AND rebuild
  // `photoListQueryOptions` so its `queryFn` closure binds to the
  // mocked `getPhotos`. The original `photoListQueryOptions`
  // captures the original `getPhotos` reference at module-load
  // time, so a plain spread of `actual` would still hit the real
  // server function when the queryFn runs (it would then trip
  // `getStartContext` because `createServerFn` requires TanStack
  // Start's async-local-storage context).
  const mockedGetPhotos = (...args: unknown[]) => getPhotosMock(...args);
  return {
    ...actual,
    getPhotos: mockedGetPhotos,
    photoListQueryOptions: (input: Partial<GetPhotosInput> = {}) => {
      const resolved = schemas.GetPhotosInputSchema.parse(input);
      return query.queryOptions({
        queryKey: ['photos', 'list', resolved] as const,
        queryFn: () => mockedGetPhotos({ data: resolved }),
      });
    },
  };
});

// --- import after mocks ---

import { paginationSearchSchema } from '@cms/shared/hooks/use-pagination-action';
import { loader, Route } from './photos';

describe('route search schema: /_cms/photos', () => {
  it('registers the shared pagination search schema', () => {
    expect(Route.options.validateSearch).toBe(paginationSearchSchema);
  });
});

describe('route loader: /_cms/photos', () => {
  beforeEach(() => {
    getPhotosMock.mockReset();
  });

  it('ensures the paginated photos Query with default (page=1, pageSize=20)', async () => {
    getPhotosMock.mockResolvedValueOnce({
      data: [],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader({
      search: {},
      context: { queryClient },
    });

    // The Query must have the cache slot populated with the
    // server function response so the page can render it via
    // `useSuspenseQuery`.
    const key = photoListQueryOptions({ page: 1, pageSize: 20 }).queryKey;
    const cached = queryClient.getQueryData(key);
    expect(cached).toEqual({
      data: [],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 0,
    });

    // The underlying server function must be invoked exactly once
    // for this slot, with the default input.
    expect(getPhotosMock).toHaveBeenCalledTimes(1);
    const firstCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ page: 1, pageSize: 20 });
  });

  it('honors explicit page and pageSize from the URL search params', async () => {
    getPhotosMock.mockResolvedValueOnce({
      data: [],
      page: 2,
      pageSize: 25,
      totalPages: 4,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader({
      search: paginationSearchSchema.parse({ page: '2', pageSize: '25' }),
      context: { queryClient },
    });

    const key = photoListQueryOptions({ page: 2, pageSize: 25 }).queryKey;
    expect(queryClient.getQueryData(key)).toEqual({
      data: [],
      page: 2,
      pageSize: 25,
      totalPages: 4,
      total: 0,
    });

    const firstCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ page: 2, pageSize: 25 });
  });

  it('honors an explicit albumId from the URL search params', async () => {
    getPhotosMock.mockResolvedValueOnce({
      data: [],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader({
      search: paginationSearchSchema.parse({ albumId: '7' }),
      context: { queryClient },
    });

    const firstCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { albumId: number; page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ albumId: 7, page: 1, pageSize: 20 });

    const key = photoListQueryOptions({
      albumId: 7,
      page: 1,
      pageSize: 20,
    }).queryKey;
    expect(queryClient.getQueryData(key)).toBeDefined();
  });

  it('drops a non-positive albumId and falls back to the unfiltered list', async () => {
    getPhotosMock.mockResolvedValue({
      data: [],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 0,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader({
      search: paginationSearchSchema.parse({ albumId: '0', page: '3' }),
      context: { queryClient },
    });

    const firstCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { albumId?: number; page: number; pageSize: number } }
      | undefined;
    expect(firstCall?.data).toEqual({ page: 3, pageSize: 20 });
    expect(firstCall?.data.albumId).toBeUndefined();

    const key = photoListQueryOptions({ page: 3, pageSize: 20 }).queryKey;
    expect(queryClient.getQueryData(key)).toBeDefined();
  });

  it('reuses the warm cache slot without refetching (staleTime: static)', async () => {
    const payload = {
      data: [],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 0,
    };
    getPhotosMock.mockResolvedValue(payload);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const first = await loader({ search: {}, context: { queryClient } });
    const second = await loader({ search: {}, context: { queryClient } });

    expect(first).toEqual(payload);
    expect(second).toEqual(payload);
    expect(getPhotosMock).toHaveBeenCalledTimes(1);
  });
});
