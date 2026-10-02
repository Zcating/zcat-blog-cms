/**
 * Tests for the album mutation hooks (`useCreateAlbum`,
 * `useUpdateAlbum`, `useDeleteAlbum`).
 *
 * The Query cache is the observation boundary: every assertion
 * reads the canonical `photoAlbumsListQueryOptions(...)` /
 * `photoAlbumDetailQueryOptions(...)` slot through
 * `queryClient.getQueryData`. Only the server-function surface
 * (`@cms/server/albums`) is mocked — the Query client, the hooks
 * and the cache are real.
 *
 * The read-after-write tests matter more than the in-mount ones:
 * the route loaders prefetch these slots with `staleTime: 'static'`,
 * so a mutation that never writes the cache is never refetched and
 * the next mount re-seeds from the unmutated payload.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  photoAlbumDetailQueryOptions,
  photoAlbumsListQueryOptions,
} from '@cms/server/albums';
import type {
  PaginatedPhotoAlbums,
  PhotoAlbum,
  PhotoAlbumDetail,
} from '@cms/server/albums/schemas';

// --- mocks (server-function boundary only) ---

const { createPhotoAlbumMock, updatePhotoAlbumMock, deletePhotoAlbumMock } =
  vi.hoisted(() => ({
    createPhotoAlbumMock: vi.fn(),
    updatePhotoAlbumMock: vi.fn(),
    deletePhotoAlbumMock: vi.fn(),
  }));

vi.mock('@cms/server/albums', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/albums')>(
      '@cms/server/albums',
    );
  return {
    ...actual,
    createPhotoAlbum: (...args: unknown[]) => createPhotoAlbumMock(...args),
    updatePhotoAlbum: (...args: unknown[]) => updatePhotoAlbumMock(...args),
    deletePhotoAlbum: (...args: unknown[]) => deletePhotoAlbumMock(...args),
  };
});

// --- import after mocks ---

import { useCreateAlbum, useDeleteAlbum, useUpdateAlbum } from './use-albums';

function buildAlbum(overrides: Partial<PhotoAlbum> = {}): PhotoAlbum {
  return {
    id: 1,
    name: '默认相册',
    description: '系统默认相册',
    available: true,
    coverId: null,
    cover: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildPagination(
  data: PhotoAlbum[] = [],
  overrides: Partial<PaginatedPhotoAlbums> = {},
): PaginatedPhotoAlbums {
  return {
    data,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    total: data.length,
    ...overrides,
  };
}

function buildAlbumDetail(
  overrides: Partial<PhotoAlbumDetail> = {},
): PhotoAlbumDetail {
  return {
    id: 1,
    name: '默认相册',
    description: '系统默认相册',
    available: true,
    coverId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 'static' } },
  });
}

const listKey = photoAlbumsListQueryOptions({ page: 1, pageSize: 10 }).queryKey;

function wrapWithClient(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function readList(queryClient: QueryClient): PaginatedPhotoAlbums | undefined {
  return queryClient.getQueryData<PaginatedPhotoAlbums>(listKey);
}

describe('useCreateAlbum', () => {
  beforeEach(() => {
    createPhotoAlbumMock.mockReset();
  });

  it('writes the server response into the list slot once the mutation resolves', async () => {
    createPhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({ id: 99, name: '新建相册' }),
    );
    const queryClient = makeQueryClient();
    queryClient.setQueryData(listKey, buildPagination([buildAlbum()]));

    const { result } = renderHook(
      () => useCreateAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    await act(async () => {
      await result.current.mutateAsync({
        name: '新建相册',
        description: '描述',
        available: true,
      });
    });

    const cached = readList(queryClient);
    expect(cached?.data.map((row) => row.name)).toEqual([
      '默认相册',
      '新建相册',
    ]);
    expect(cached?.data.some((row) => row.id === 99)).toBe(true);
  });

  it('shows the optimistic row (loading) while the server call is in flight', async () => {
    const deferred = Promise.withResolvers<PhotoAlbum>();
    createPhotoAlbumMock.mockReturnValueOnce(deferred.promise);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(listKey, buildPagination([buildAlbum()]));

    const { result } = renderHook(
      () => useCreateAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    let pending: Promise<PhotoAlbum> = Promise.resolve(
      buildAlbum({ id: 99, name: '新建相册' }),
    );
    await act(async () => {
      pending = result.current.mutateAsync({
        name: '新建相册',
        description: '描述',
        available: true,
      });
      await Promise.resolve();
    });

    const optimisticRow = readList(queryClient)?.data.at(-1) as
      | (PhotoAlbum & { loading?: boolean })
      | undefined;
    expect(optimisticRow?.name).toBe('新建相册');
    expect(optimisticRow?.loading).toBe(true);

    await act(async () => {
      deferred.resolve(buildAlbum({ id: 99, name: '新建相册' }));
      await pending;
    });

    const committedRow = readList(queryClient)?.data.at(-1) as
      | (PhotoAlbum & { loading?: boolean })
      | undefined;
    expect(committedRow?.id).toBe(99);
    expect(committedRow?.loading).toBeUndefined();
  });

  it('restores the previous snapshot when the server call rejects', async () => {
    createPhotoAlbumMock.mockRejectedValueOnce(new Error('server boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([buildAlbum()]);
    queryClient.setQueryData(listKey, seeded);

    const { result } = renderHook(
      () => useCreateAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    await act(async () => {
      await result.current
        .mutateAsync({
          name: '新建相册',
          description: '描述',
          available: true,
        })
        .catch(() => undefined);
    });

    expect(readList(queryClient)).toEqual(seeded);
  });
});

describe('useUpdateAlbum', () => {
  beforeEach(() => {
    updatePhotoAlbumMock.mockReset();
  });

  it('writes the server response into both the list and detail slots', async () => {
    updatePhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({
        id: 1,
        name: '默认相册-改名',
        description: '新描述',
        available: false,
      }),
    );
    const queryClient = makeQueryClient();
    queryClient.setQueryData(listKey, buildPagination([buildAlbum()]));
    queryClient.setQueryData(
      photoAlbumDetailQueryOptions({ id: 1 }).queryKey,
      buildAlbumDetail(),
    );

    const { result } = renderHook(() => useUpdateAlbum(), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 1,
        name: '默认相册-改名',
        description: '新描述',
        available: false,
      });
    });

    expect(readList(queryClient)?.data[0]?.name).toBe('默认相册-改名');
    expect(readList(queryClient)?.data[0]?.available).toBe(false);
    const detail = queryClient.getQueryData<PhotoAlbumDetail>(
      photoAlbumDetailQueryOptions({ id: 1 }).queryKey,
    );
    expect(detail?.name).toBe('默认相册-改名');
    expect(detail?.description).toBe('新描述');
  });

  it('patches the cached rows optimistically before the server responds', async () => {
    const deferred = Promise.withResolvers<PhotoAlbum>();
    updatePhotoAlbumMock.mockReturnValueOnce(deferred.promise);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(listKey, buildPagination([buildAlbum()]));

    const { result } = renderHook(() => useUpdateAlbum(), {
      wrapper: wrapWithClient(queryClient),
    });

    let pending: Promise<PhotoAlbum> = Promise.resolve(buildAlbum());
    await act(async () => {
      pending = result.current.mutateAsync({
        id: 1,
        name: '默认相册-改名',
        description: '新描述',
        available: true,
      });
      await Promise.resolve();
    });

    expect(readList(queryClient)?.data[0]?.name).toBe('默认相册-改名');

    await act(async () => {
      deferred.resolve(buildAlbum({ id: 1, name: '默认相册-改名' }));
      await pending;
    });
  });

  it('restores the previous snapshot of both slots when the server call rejects', async () => {
    updatePhotoAlbumMock.mockRejectedValueOnce(new Error('server boom'));
    const queryClient = makeQueryClient();
    const seededList = buildPagination([buildAlbum()]);
    const seededDetail = buildAlbumDetail();
    queryClient.setQueryData(listKey, seededList);
    queryClient.setQueryData(
      photoAlbumDetailQueryOptions({ id: 1 }).queryKey,
      seededDetail,
    );

    const { result } = renderHook(() => useUpdateAlbum(), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await result.current
        .mutateAsync({
          id: 1,
          name: '默认相册-改名',
          description: '新描述',
          available: false,
        })
        .catch(() => undefined);
    });

    expect(readList(queryClient)).toEqual(seededList);
    const detail = queryClient.getQueryData<PhotoAlbumDetail>(
      photoAlbumDetailQueryOptions({ id: 1 }).queryKey,
    );
    expect(detail).toEqual(seededDetail);
  });
});

describe('useDeleteAlbum', () => {
  beforeEach(() => {
    deletePhotoAlbumMock.mockReset();
  });

  it('removes the album from the list slot once the mutation resolves', async () => {
    deletePhotoAlbumMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      listKey,
      buildPagination([
        buildAlbum({ id: 1, name: '默认相册' }),
        buildAlbum({ id: 7, name: '待删除相册' }),
      ]),
    );

    const { result } = renderHook(
      () => useDeleteAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    await act(async () => {
      await result.current.mutateAsync(7);
    });

    expect(readList(queryClient)?.data.map((row) => row.id)).toEqual([1]);
  });

  it('removes the album optimistically before the server responds', async () => {
    const deferred = Promise.withResolvers<void>();
    deletePhotoAlbumMock.mockReturnValueOnce(deferred.promise);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      listKey,
      buildPagination([
        buildAlbum({ id: 1 }),
        buildAlbum({ id: 7, name: '待删除相册' }),
      ]),
    );

    const { result } = renderHook(
      () => useDeleteAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    let pending: Promise<void> = Promise.resolve();
    await act(async () => {
      pending = result.current.mutateAsync(7);
      await Promise.resolve();
    });

    expect(readList(queryClient)?.data.map((row) => row.id)).toEqual([1]);

    await act(async () => {
      deferred.resolve(undefined);
      await pending;
    });
  });

  it('restores the previous snapshot when the server call rejects', async () => {
    deletePhotoAlbumMock.mockRejectedValueOnce(new Error('server boom'));
    const queryClient = makeQueryClient();
    const seeded = buildPagination([
      buildAlbum({ id: 1 }),
      buildAlbum({ id: 7, name: '待删除相册' }),
    ]);
    queryClient.setQueryData(listKey, seeded);

    const { result } = renderHook(
      () => useDeleteAlbum({ page: 1, pageSize: 10 }),
      {
        wrapper: wrapWithClient(queryClient),
      },
    );

    await act(async () => {
      await result.current.mutateAsync(7).catch(() => undefined);
    });

    expect(readList(queryClient)).toEqual(seeded);
  });

  it('keeps the album removed from the cache after the consumer unmounts and remounts', async () => {
    deletePhotoAlbumMock.mockResolvedValueOnce(undefined);
    const queryClient = makeQueryClient();
    queryClient.setQueryData(
      listKey,
      buildPagination([
        buildAlbum({ id: 1, name: '默认相册' }),
        buildAlbum({ id: 7, name: '待删除相册' }),
      ]),
    );

    const first = renderHook(() => useDeleteAlbum({ page: 1, pageSize: 10 }), {
      wrapper: wrapWithClient(queryClient),
    });

    await act(async () => {
      await first.result.current.mutateAsync(7);
    });
    first.unmount();

    const second = renderHook(() => useDeleteAlbum({ page: 1, pageSize: 10 }), {
      wrapper: wrapWithClient(queryClient),
    });
    expect(second.result.current.variables).toBeUndefined();
    expect(readList(queryClient)?.data.map((row) => row.id)).toEqual([1]);
  });
});
