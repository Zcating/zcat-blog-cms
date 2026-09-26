/**
 * Tests for the `_cms/albums/$albumId` route file.
 *
 * Scope:
 *   - The loader reads `albumId` from `params.albumId` and the
 *     `page` / `pageSize` pagination from the router's parsed
 *     search object (defaulting to 1 / 20).
 *   - The loader hydrates three parallel Query slots in one
 *     `Promise.all`:
 *       1. `photoAlbumDetailQueryOptions({ id })`
 *       2. `photoListQueryOptions({ albumId, page, pageSize })`
 *       3. `emptyAlbumPhotosQueryOptions()`
 *   - Invalid `albumId` (NaN / non-numeric) causes the loader to
 *     throw so the route's error boundary can take over.
 *
 * Only the server-function surface (`@cms/server/albums`,
 * `@cms/server/photos`) is mocked. The `QueryClient` is
 * exercised as-is.
 *
 * Note: the real `queryOptions` factories are closures over the
 * `createServerFn`-wrapped server functions. Vitest's module
 * mocks cannot rewrite the captured reference inside the
 * factories, so we replace the factories themselves with stubs
 * that invoke our test mocks — that way the loader's
 * `query` round-trip can run end-to-end without
 * booting the TanStack Start runtime.
 */

import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  emptyAlbumPhotosQueryOptions,
  photoListQueryOptions,
} from '@cms/server/photos';

const { getPhotoAlbumMock, getPhotosMock, getEmptyAlbumPhotosMock } =
  vi.hoisted(() => ({
    getPhotoAlbumMock: vi.fn(),
    getPhotosMock: vi.fn(),
    getEmptyAlbumPhotosMock: vi.fn(),
  }));

vi.mock('@cms/server/albums', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/albums')>(
      '@cms/server/albums',
    );
  return {
    ...actual,
    getPhotoAlbum: (...args: unknown[]) => getPhotoAlbumMock(...args),
    photoAlbumDetailQueryOptions: (input: { id: number }) => ({
      queryKey: ['albums', 'detail', input.id] as const,
      queryFn: () => getPhotoAlbumMock({ data: input }),
    }),
  };
});

vi.mock('@cms/server/photos', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/photos')>(
      '@cms/server/photos',
    );
  return {
    ...actual,
    getPhotos: (...args: unknown[]) => getPhotosMock(...args),
    getEmptyAlbumPhotos: (...args: unknown[]) =>
      getEmptyAlbumPhotosMock(...args),
    photoListQueryOptions: (
      input: Partial<{ albumId: number; page: number; pageSize: number }> = {},
    ) => {
      const resolved = {
        albumId: input.albumId,
        page: input.page ?? 1,
        pageSize: input.pageSize ?? 20,
      };
      return {
        queryKey: ['photos', 'list', resolved] as const,
        queryFn: () => getPhotosMock({ data: resolved }),
      };
    },
    emptyAlbumPhotosQueryOptions: () => ({
      queryKey: ['photos', 'empty-album'] as const,
      queryFn: () => getEmptyAlbumPhotosMock(),
    }),
  };
});

// --- import after mocks ---

import { photoAlbumDetailQueryOptions } from '@cms/server/albums';

import { loader } from './albums_.$albumId';

const ALBUM_DETAIL = {
  id: 7,
  name: '旅行相册',
  description: '记录旅行的美好瞬间',
  available: true,
  coverId: null,
  createdAt: '2025-02-15T00:00:00.000Z',
  updatedAt: '2025-02-15T00:00:00.000Z',
};

const ALBUM_PHOTOS = {
  data: [
    {
      id: 1,
      name: '风景照',
      url: 'photos/1.jpg',
      thumbnailUrl: 'photos/thumb_1.jpg',
      albumId: 7,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    },
  ],
  page: 1,
  pageSize: 20,
  totalPages: 1,
  total: 1,
};

const EMPTY_ALBUM_PHOTOS = [
  {
    id: 100,
    name: '未关联照片',
    url: 'photos/100.jpg',
    thumbnailUrl: 'photos/thumb_100.jpg',
    albumId: null,
    createdAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2025-03-01T00:00:00.000Z',
  },
];

function buildSearch(searchStr: string): Record<string, unknown> {
  return Object.fromEntries(new URLSearchParams(searchStr));
}

function buildLoaderArgs(
  search: Record<string, unknown>,
  params: { albumId?: string },
  queryClient: QueryClient,
): Parameters<typeof loader>[0] {
  return {
    search,
    params,
    context: { queryClient },
  };
}

describe('route loader: /_cms/albums/$albumId', () => {
  beforeEach(() => {
    getPhotoAlbumMock.mockReset();
    getPhotosMock.mockReset();
    getEmptyAlbumPhotosMock.mockReset();
  });

  it('hydrates three parallel Query slots for album / photos / empty-album photos', async () => {
    getPhotoAlbumMock.mockResolvedValueOnce(ALBUM_DETAIL);
    getPhotosMock.mockResolvedValueOnce(ALBUM_PHOTOS);
    getEmptyAlbumPhotosMock.mockResolvedValueOnce(EMPTY_ALBUM_PHOTOS);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader(
      buildLoaderArgs(buildSearch(''), { albumId: '7' }, queryClient),
    );

    // Each Query slot must be populated by its corresponding
    // server function.
    expect(
      queryClient.getQueryData(
        photoAlbumDetailQueryOptions({ id: 7 }).queryKey,
      ),
    ).toEqual(ALBUM_DETAIL);
    expect(
      queryClient.getQueryData(
        photoListQueryOptions({ albumId: 7, page: 1, pageSize: 20 }).queryKey,
      ),
    ).toEqual(ALBUM_PHOTOS);
    expect(
      queryClient.getQueryData(emptyAlbumPhotosQueryOptions().queryKey),
    ).toEqual(EMPTY_ALBUM_PHOTOS);

    // All three server functions must have been invoked exactly
    // once — the loader does NOT retry.
    expect(getPhotoAlbumMock).toHaveBeenCalledTimes(1);
    expect(getPhotosMock).toHaveBeenCalledTimes(1);
    expect(getEmptyAlbumPhotosMock).toHaveBeenCalledTimes(1);

    // The photos server function must be called with the albumId.
    const photosCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { albumId: number; page: number; pageSize: number } }
      | undefined;
    expect(photosCall?.data).toEqual({ albumId: 7, page: 1, pageSize: 20 });
  });

  it('honors explicit page and pageSize from the URL search params', async () => {
    getPhotoAlbumMock.mockResolvedValueOnce(ALBUM_DETAIL);
    getPhotosMock.mockResolvedValueOnce({
      ...ALBUM_PHOTOS,
      page: 3,
      pageSize: 10,
      totalPages: 5,
    });
    getEmptyAlbumPhotosMock.mockResolvedValueOnce(EMPTY_ALBUM_PHOTOS);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await loader(
      buildLoaderArgs(
        buildSearch('?page=3&pageSize=10'),
        { albumId: '7' },
        queryClient,
      ),
    );

    const photosCall = getPhotosMock.mock.calls[0]?.[0] as
      | { data: { albumId: number; page: number; pageSize: number } }
      | undefined;
    expect(photosCall?.data).toEqual({ albumId: 7, page: 3, pageSize: 10 });

    expect(
      queryClient.getQueryData(
        photoListQueryOptions({ albumId: 7, page: 3, pageSize: 10 }).queryKey,
      ),
    ).toMatchObject({
      page: 3,
      pageSize: 10,
      totalPages: 5,
    });
  });

  it('throws when albumId is not numeric', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(
      loader(
        buildLoaderArgs(
          buildSearch(''),
          { albumId: 'not-a-number' },
          queryClient,
        ),
      ),
    ).rejects.toThrow('Invalid album id');
    // Server functions must NOT have been called — invalid input
    // is rejected up front.
    expect(getPhotoAlbumMock).not.toHaveBeenCalled();
    expect(getPhotosMock).not.toHaveBeenCalled();
    expect(getEmptyAlbumPhotosMock).not.toHaveBeenCalled();
  });
});
