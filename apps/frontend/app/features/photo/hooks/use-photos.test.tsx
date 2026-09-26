/**
 * Tests for the photos hooks (`usePhotosList`).
 *
 * Scope:
 *   - `usePhotosList` reads the paginated photos from the
 *     canonical `photoListQueryOptions` cache key.
 *
 * Only the server-function boundary (`@cms/server/photos`) is
 * mocked. The Query client is real, the hook is real, and the
 * cache is asserted directly via `queryClient.getQueryData`.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { photoListQueryOptions } from '@cms/server/photos';
import type { PaginatedPhotos } from '@cms/server/photos/schemas';

import { usePhotosList } from './use-photos';

vi.mock('@cms/server/photos', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/photos')>(
      '@cms/server/photos',
    );
  return actual;
});

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
}

function seedList(
  queryClient: QueryClient,
  pagination: PaginatedPhotos,
  input = { page: 1, pageSize: 20 },
): void {
  queryClient.setQueryData(photoListQueryOptions(input).queryKey, pagination);
}

function wrapWithClient(queryClient: QueryClient) {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('usePhotosList', () => {
  it('returns the paginated photos from the Query cache', () => {
    const queryClient = makeQueryClient();
    const seeded: PaginatedPhotos = {
      data: [
        {
          id: 1,
          name: '风景照',
          url: 'photos/1.jpg',
          thumbnailUrl: 'photos/thumb_1.jpg',
        },
      ],
      page: 1,
      pageSize: 20,
      totalPages: 1,
      total: 1,
    };
    seedList(queryClient, seeded);

    const { result } = renderHook(
      () => usePhotosList({ page: 1, pageSize: 20 }),
      { wrapper: wrapWithClient(queryClient) },
    );

    expect(result.current.data).toEqual(seeded);
  });

  it('exposes the canonical query key for cache subscriptions', () => {
    const queryClient = makeQueryClient();
    seedList(
      queryClient,
      { data: [], page: 1, pageSize: 20, totalPages: 1, total: 0 },
      { page: 1, pageSize: 20 },
    );

    const { result } = renderHook(
      () => usePhotosList({ page: 1, pageSize: 20 }),
      { wrapper: wrapWithClient(queryClient) },
    );

    expect(result.current.queryKey).toEqual(
      photoListQueryOptions({ page: 1, pageSize: 20 }).queryKey,
    );
  });
});
