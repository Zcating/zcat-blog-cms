/**
 * Tests for the album-detail photo mutation hooks
 * (`useCreateAlbumPhoto`, `useUpdateAlbumPhoto`,
 * `useDeleteAlbumPhoto`, `useAddPhotosToAlbum`, `useSetAlbumCover`).
 *
 * The Query cache is the observation boundary: the album's photo
 * list slot (`photoListQueryOptions({ albumId, page, pageSize })`)
 * and the album detail slot
 * (`photoAlbumDetailQueryOptions({ id }).queryKey`) are read back
 * through `queryClient.getQueryData`. Only the server-function
 * surface (`@cms/server/albums`, `@cms/server/photos`) and the
 * OSS action (`@cms/core`) are mocked.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { photoAlbumDetailQueryOptions } from '@cms/server/albums';
import type { PhotoAlbumDetail } from '@cms/server/albums/schemas';
import { photoListQueryOptions } from '@cms/server/photos';
import type {
  GetPhotosInput,
  PaginatedPhotos,
  Photo,
} from '@cms/server/photos/schemas';

// --- mocks (server-function boundary only) ---

const {
  addPhotosMock,
  setPhotoAlbumCoverMock,
  createAlbumPhotoMock,
  updatePhotoMock,
  deletePhotoMock,
} = vi.hoisted(() => ({
  addPhotosMock: vi.fn(),
  setPhotoAlbumCoverMock: vi.fn(),
  createAlbumPhotoMock: vi.fn(),
  updatePhotoMock: vi.fn(),
  deletePhotoMock: vi.fn(),
}));

vi.mock('@cms/server/albums', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/albums')>(
      '@cms/server/albums',
    );
  return {
    ...actual,
    addPhotos: (...args: unknown[]) => addPhotosMock(...args),
    setPhotoAlbumCover: (...args: unknown[]) => setPhotoAlbumCoverMock(...args),
  };
});

vi.mock('@cms/core', async () => {
  const actual = await vi.importActual<typeof import('@cms/core')>('@cms/core');
  return {
    ...actual,
    OssAction: {
      createAlbumPhoto: (...args: unknown[]) => createAlbumPhotoMock(...args),
      updatePhoto: (...args: unknown[]) => updatePhotoMock(...args),
      deletePhoto: (...args: unknown[]) => deletePhotoMock(...args),
    },
  };
});

// --- import after mocks ---

import {
  useAddPhotosToAlbum,
  useCreateAlbumPhoto,
  useDeleteAlbumPhoto,
  useSetAlbumCover,
  useUpdateAlbumPhoto,
} from './use-album-photos';

const photoInput: GetPhotosInput = { albumId: 5, page: 1, pageSize: 20 };
const photoKey = photoListQueryOptions(photoInput).queryKey;
const detailKey = photoAlbumDetailQueryOptions({ id: 5 }).queryKey;

function buildPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 1,
    name: '风景照',
    url: 'photos/1.jpg',
    thumbnailUrl: 'photos/thumb_1.jpg',
    albumId: 5,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildPagination(
  data: Photo[] = [],
  overrides: Partial<PaginatedPhotos> = {},
): PaginatedPhotos {
  return {
    data,
    page: 1,
    pageSize: 20,
    totalPages: 1,
    total: data.length,
    ...overrides,
  };
}

function buildAlbumDetail(
  overrides: Partial<PhotoAlbumDetail> = {},
): PhotoAlbumDetail {
  return {
    id: 5,
    name: '旅行相册',
    description: '记录旅行的美好瞬间',
    available: true,
    coverId: null,
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
    ...overrides,
  };
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 'static' } },
  });
}

function wrapWithClient(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function readPhotos(queryClient: QueryClient): PaginatedPhotos | undefined {
  return queryClient.getQueryData<PaginatedPhotos>(photoKey);
}

describe('useCreateAlbumPhoto', () => {
  beforeEach(() => {
    createAlbumPhotoMock.mockReset();
  });

  it('writes the uploaded photo into the album photo slot once the mutation resolves', async () => {
    createAlbumPhotoMock.mockResolvedValueOnce(
      buildPhoto({ id: 200, name: '新建照片', albumId: 5 }),
    );
    const queryClient = makeQueryClient();
    queryClient.setQueryData(photoKey, buildPagination([buildPhoto()]));

    const { result } = renderHook(() => useCreateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 0,
        name: '新建照片',
        image: 'photos/upload.jpg',
        albumId: 5,
      });
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.id)).toEqual([
      1, 200,
    ]);
  });

  it('restores the previous snapshot when the upload rejects', async () => {
    createAlbumPhotoMock.mockRejectedValueOnce(new Error('upload boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([buildPhoto()]);
    queryClient.setQueryData(photoKey, seeded);

    const { result } = renderHook(() => useCreateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          id: 0,
          name: '新建照片',
          image: 'photos/upload.jpg',
          albumId: 5,
        })
        .catch(() => undefined);
    });

    expect(readPhotos(queryClient)).toEqual(seeded);
  });

  it('keeps the new photo in the cache after the consumer unmounts and remounts', async () => {
    createAlbumPhotoMock.mockResolvedValueOnce(
      buildPhoto({ id: 200, name: '新建照片', albumId: 5 }),
    );
    const queryClient = makeQueryClient();
    queryClient.setQueryData(photoKey, buildPagination([buildPhoto()]));

    const first = renderHook(() => useCreateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });
    await act(async () => {
      await first.result.current.mutateAsync({
        id: 0,
        name: '新建照片',
        image: 'photos/upload.jpg',
        albumId: 5,
      });
    });
    first.unmount();

    renderHook(() => useCreateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.id)).toEqual([
      1, 200,
    ]);
  });
});

describe('useUpdateAlbumPhoto', () => {
  beforeEach(() => {
    updatePhotoMock.mockReset();
  });

  it('replaces the matching photo in the album photo slot', async () => {
    updatePhotoMock.mockResolvedValueOnce(
      buildPhoto({ id: 1, name: '改名', albumId: 5 }),
    );
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      photoKey,
      buildPagination([buildPhoto(), buildPhoto({ id: 2, name: '人物照' })]),
    );

    const { result } = renderHook(() => useUpdateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 1,
        name: '改名',
        image: 'photos/1.jpg',
        albumId: 5,
      });
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.name)).toEqual([
      '改名',
      '人物照',
    ]);
  });

  it('restores the previous snapshot when the update rejects', async () => {
    updatePhotoMock.mockRejectedValueOnce(new Error('update boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([buildPhoto()]);
    queryClient.setQueryData(photoKey, seeded);

    const { result } = renderHook(() => useUpdateAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          id: 1,
          name: '改名',
          image: 'photos/1.jpg',
          albumId: 5,
        })
        .catch(() => undefined);
    });

    expect(readPhotos(queryClient)).toEqual(seeded);
  });
});

describe('useDeleteAlbumPhoto', () => {
  beforeEach(() => {
    deletePhotoMock.mockReset();
  });

  it('removes the photo from the album photo slot once the mutation resolves', async () => {
    deletePhotoMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      photoKey,
      buildPagination([buildPhoto({ id: 1 }), buildPhoto({ id: 2 })]),
    );

    const { result } = renderHook(() => useDeleteAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.id)).toEqual([2]);
  });

  it('restores the previous snapshot when the delete rejects', async () => {
    deletePhotoMock.mockRejectedValueOnce(new Error('delete boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([
      buildPhoto({ id: 1 }),
      buildPhoto({ id: 2 }),
    ]);
    queryClient.setQueryData(photoKey, seeded);

    const { result } = renderHook(() => useDeleteAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(1).catch(() => undefined);
    });

    expect(readPhotos(queryClient)).toEqual(seeded);
  });

  it('keeps the photo deleted in the cache after the consumer unmounts and remounts', async () => {
    deletePhotoMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      photoKey,
      buildPagination([buildPhoto({ id: 1 }), buildPhoto({ id: 2 })]),
    );

    const first = renderHook(() => useDeleteAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });
    await act(async () => {
      await first.result.current.mutateAsync(1);
    });
    first.unmount();

    renderHook(() => useDeleteAlbumPhoto(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.id)).toEqual([2]);
  });
});

describe('useAddPhotosToAlbum', () => {
  beforeEach(() => {
    addPhotosMock.mockReset();
  });

  it('adds the selected photos to the album photo slot', async () => {
    addPhotosMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      photoKey,
      buildPagination([buildPhoto({ id: 1 })]),
    );

    const { result } = renderHook(() => useAddPhotosToAlbum(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        albumId: 5,
        photos: [buildPhoto({ id: 100, albumId: null })],
      });
    });

    expect(readPhotos(queryClient)?.data.map((row) => row.id)).toEqual([
      100, 1,
    ]);
    expect(
      readPhotos(queryClient)?.data.find((row) => row.id === 100)?.albumId,
    ).toBe(5);
  });

  it('restores the previous snapshot when addPhotos rejects', async () => {
    addPhotosMock.mockRejectedValueOnce(new Error('add boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([buildPhoto({ id: 1 })]);
    queryClient.setQueryData(photoKey, seeded);

    const { result } = renderHook(() => useAddPhotosToAlbum(photoInput), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          albumId: 5,
          photos: [buildPhoto({ id: 100, albumId: null })],
        })
        .catch(() => undefined);
    });

    expect(readPhotos(queryClient)).toEqual(seeded);
  });
});

describe('useSetAlbumCover', () => {
  beforeEach(() => {
    setPhotoAlbumCoverMock.mockReset();
  });

  it('writes coverId into the album detail slot', async () => {
    setPhotoAlbumCoverMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(detailKey, buildAlbumDetail());

    const { result } = renderHook(() => useSetAlbumCover(5), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(9);
    });

    expect(queryClient.getQueryData<PhotoAlbumDetail>(detailKey)?.coverId).toBe(
      9,
    );
  });

  it('keeps coverId in the cache after the consumer unmounts and remounts', async () => {
    setPhotoAlbumCoverMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(detailKey, buildAlbumDetail());

    const first = renderHook(() => useSetAlbumCover(5), {
      wrapper: wrapWithClient(queryClient),
    });
    await act(async () => {
      await first.result.current.mutateAsync(9);
    });
    first.unmount();

    renderHook(() => useSetAlbumCover(5), {
      wrapper: wrapWithClient(queryClient),
    });

    expect(queryClient.getQueryData<PhotoAlbumDetail>(detailKey)?.coverId).toBe(
      9,
    );
  });

  it('leaves the detail slot untouched when the server call rejects', async () => {
    setPhotoAlbumCoverMock.mockRejectedValueOnce(new Error('cover boom'));
    const queryClient = makeQueryClient();
    const seeded = buildAlbumDetail();
    queryClient.setQueryData(detailKey, seeded);

    const { result } = renderHook(() => useSetAlbumCover(5), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync(9).catch(() => undefined);
    });

    expect(queryClient.getQueryData<PhotoAlbumDetail>(detailKey)).toEqual(
      seeded,
    );
  });
});
