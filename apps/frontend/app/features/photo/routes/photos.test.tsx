/**
 * Tests for the photos list page (`Photos`).
 *
 * Scope (Phase 3b photos lane):
 *   1. The page reads its paginated data from `useSuspenseQuery`
 *      against `photoListQueryOptions` (Query, not loaderData).
 *   2. It renders the photo cards through `PhotoCard`.
 *   3. Empty pagination renders the empty state and a "新增" button.
 *   4. Create mutation uploads + records via `OssAction.createPhoto`
 *      and inserts the new photo into the Query cache optimistically.
 *   5. Update mutation calls `OssAction.updatePhoto` and replaces
 *      the entry in the cache.
 *   6. Delete mutation calls `OssAction.deletePhoto` after a
 *      confirmation dialog and removes the entry optimistically.
 *
 * Mocks (external server/query boundary only):
 *   - `@cms/server/photos`     — server function surface (read)
 *   - `@cms/core`              — `useOptimisticArray` /
 *                                `PaginationWorkspace` /
 *                                `createSchemaForm` factory /
 *                                `OssAction` are exercised as-is;
 *                                the schema-form factory is stubbed
 *                                because it is a UI-only path.
 *   - `@zcat/ui`               — DOM components.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { photoListQueryOptions } from '@cms/server/photos';
import type {
  GetPhotosInput,
  PaginatedPhotos,
  Photo,
} from '@cms/server/photos/schemas';

// --- mocks (boundaries only) ---

const { getPhotosMock, photoListQueryOptionsSpy } = vi.hoisted(() => ({
  getPhotosMock: vi.fn(),
  photoListQueryOptionsSpy: vi.fn(),
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
  // The original `photoListQueryOptions` captures the original
  // `getPhotos` reference at module-load time, so spreading
  // `actual` would still hit the real server function when the
  // queryFn runs (which would then trip `getStartContext` because
  // `createServerFn` requires TanStack Start's async-local-storage
  // context). Rebuild the factory so its `queryFn` closure binds
  // to the mocked `getPhotos`.
  const mockedGetPhotos = (...args: unknown[]) => getPhotosMock(...args);
  return {
    ...actual,
    getPhotos: mockedGetPhotos,
    photoListQueryOptions: (input: Partial<GetPhotosInput> = {}) => {
      photoListQueryOptionsSpy(input);
      const resolved = schemas.GetPhotosInputSchema.parse(input);
      return query.queryOptions({
        queryKey: ['photos', 'list', resolved] as const,
        queryFn: () => mockedGetPhotos({ data: resolved }),
      });
    },
  };
});

const createPhotoActionMock = vi.fn();
const updatePhotoActionMock = vi.fn();
const deletePhotoActionMock = vi.fn();

// Stub only the schema-form factory and the OssAction entry points
// that drive upload+create / update / delete. The optimistic
// reducer, `PaginationWorkspace`, and `useOptimisticArray` are
// exercised as-is so the optimistic / rollback semantics stay
// real.
vi.mock('@cms/core', async () => {
  const actual = await vi.importActual<typeof import('@cms/core')>('@cms/core');
  return {
    ...actual,
    OssAction: {
      createPhoto: (...args: unknown[]) => createPhotoActionMock(...args),
      updatePhoto: (...args: unknown[]) => updatePhotoActionMock(...args),
      deletePhoto: (...args: unknown[]) => deletePhotoActionMock(...args),
    },
    createSchemaForm:
      () =>
      (options: { onSubmit: (data: unknown) => Promise<void> | void }) => {
        return (values: unknown) => options.onSubmit(values);
      },
    PaginationWorkspace: ({
      title,
      page,
      pageSize,
      totalPages,
      operation,
      children,
    }: {
      title: string;
      page: number;
      pageSize: number;
      totalPages: number;
      children?: React.ReactNode;
      operation?: React.ReactNode;
    }) => (
      <div data-testid="PaginationWorkspace">
        <h1>{title}</h1>
        <div data-testid="pagination-info">
          {page}/{totalPages} (每页{pageSize}条)
        </div>
        {operation}
        {children}
      </div>
    ),
  };
});

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface ZGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  columnClassName?: string;
}

vi.mock('@zcat/ui', () => ({
  ZButton: ({ children, onClick, loading, disabled }: ButtonProps) => (
    <button onClick={onClick} disabled={disabled} data-loading={loading}>
      {children}
    </button>
  ),
  ZDialog: { confirm: vi.fn().mockResolvedValue(true) },
  ZGrid: <T,>({ items, renderItem, columnClassName }: ZGridProps<T>) => (
    <div data-testid="ZGrid" data-column-class={columnClassName}>
      {items.map((item, i) => (
        <div key={i} data-testid="ZGrid-item">
          {renderItem(item)}
        </div>
      ))}
    </div>
  ),
  ZView: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <div className={className}>{children}</div>,
  ZImagePreload: ({ alt }: { alt: string }) => <img alt={alt} />,
  safeNumber: (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isNaN(n) ? d : n;
  },
}));

vi.mock('@cms/features/album/components/album', () => ({
  PhotoCard: ({
    data,
    onEdit,
    onDelete,
  }: {
    data: Photo & { loading?: boolean };
    onEdit: (data: Photo) => void;
    onDelete: (data: Photo) => void;
  }) => (
    <div data-testid="photo-card" data-id={data.id} data-loading={data.loading}>
      <span>{data.name}</span>
      <button data-testid="edit-photo-btn" onClick={() => onEdit(data)}>
        编辑
      </button>
      <button data-testid="delete-photo-btn" onClick={() => onDelete(data)}>
        删除
      </button>
    </div>
  ),
}));

// --- import after mocks ---

import Photos from './photos';

function buildPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 1,
    name: '风景照',
    url: 'photos/1.jpg',
    thumbnailUrl: 'photos/thumb_1.jpg',
    albumId: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function buildPaginatedPhotos(
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

interface CacheSlot {
  input: Partial<GetPhotosInput>;
  pagination: PaginatedPhotos;
}

interface RenderOverrides {
  pagination?: PaginatedPhotos;
  input?: Partial<GetPhotosInput>;
  search?: Record<string, unknown>;
  extraSlots?: CacheSlot[];
}

function renderPhotos(overrides: RenderOverrides = {}) {
  const input = overrides.input ?? { page: 1, pageSize: 20 };
  const search = overrides.search ?? {};
  const pagination =
    overrides.pagination ??
    buildPaginatedPhotos([buildPhoto({ id: 1, name: '风景照' })]);

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(photoListQueryOptions(input).queryKey, pagination);
  for (const slot of overrides.extraSlots ?? []) {
    queryClient.setQueryData(
      photoListQueryOptions(slot.input).queryKey,
      slot.pagination,
    );
  }

  // The seeding calls above are harness setup, not the page. Reset the
  // spy so `mock.calls[0]` is the first Query input the page itself
  // derived and read.
  photoListQueryOptionsSpy.mockClear();

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Photos search={search} />
      </QueryClientProvider>,
    ),
  };
}

const albumInput: GetPhotosInput = { albumId: 7, page: 1, pageSize: 20 };

function unfilteredKey() {
  return photoListQueryOptions({ page: 1, pageSize: 20 }).queryKey;
}

function readAlbumSlot(queryClient: QueryClient): PaginatedPhotos | undefined {
  return queryClient.getQueryData<PaginatedPhotos>(
    photoListQueryOptions(albumInput).queryKey,
  );
}

function renderPhotosWithAlbumFilter(unfilteredSeed: PaginatedPhotos) {
  return renderPhotos({
    search: { albumId: 7 },
    input: albumInput,
    pagination: buildPaginatedPhotos(
      [buildPhoto({ id: 7, name: '相册七照片', albumId: 7 })],
      { page: 1, pageSize: 20, totalPages: 1, total: 1 },
    ),
    extraSlots: [
      { input: { page: 1, pageSize: 20 }, pagination: unfilteredSeed },
    ],
  });
}

describe('Photos list page', () => {
  beforeEach(() => {
    createPhotoActionMock.mockReset();
    updatePhotoActionMock.mockReset();
    deletePhotoActionMock.mockReset();
  });

  it('renders the page title and pagination metadata from Query cache', () => {
    renderPhotos();

    expect(screen.getByText('照片')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('1/1');
    expect(screen.getByText('风景照')).toBeInTheDocument();
  });

  it('renders the empty grid when the cache has no photos', () => {
    renderPhotos({ pagination: buildPaginatedPhotos([]) });

    expect(screen.getByText('照片')).toBeInTheDocument();
    expect(screen.getByTestId('ZGrid')).toBeInTheDocument();
    expect(screen.queryByTestId('photo-card')).not.toBeInTheDocument();
  });

  it('exposes a "新增" operation button', () => {
    renderPhotos();

    expect(screen.getByRole('button', { name: '新增' })).toBeInTheDocument();
  });

  it('reads paginated photos through the Query cache (Query, not loaderData)', () => {
    // If the page tried to read from `loaderData` it would crash
    // (undefined). We confirm the cache is the source of truth by
    // pre-seeding the cache and asserting the photos render.
    renderPhotos({
      pagination: buildPaginatedPhotos([
        buildPhoto({ id: 1, name: '风景照' }),
        buildPhoto({ id: 2, name: '人物照' }),
      ]),
    });

    expect(screen.getByText('风景照')).toBeInTheDocument();
    expect(screen.getByText('人物照')).toBeInTheDocument();
  });

  it('invokes OssAction.createPhoto when the create form is submitted', async () => {
    createPhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 99, name: '新建照片' }),
    );

    renderPhotos();

    fireEvent.click(screen.getByRole('button', { name: '新增' }));

    await waitFor(() => {
      expect(createPhotoActionMock).toHaveBeenCalledTimes(1);
    });

    const callArg = createPhotoActionMock.mock.calls[0]?.[0] as
      | { name: string; image: string }
      | undefined;
    expect(callArg?.name).toBeTruthy();
  });

  it('rolls back the optimistic create when OssAction.createPhoto rejects', async () => {
    createPhotoActionMock.mockRejectedValueOnce(new Error('upload boom'));

    renderPhotos();

    fireEvent.click(screen.getByRole('button', { name: '新增' }));

    await waitFor(() => {
      expect(createPhotoActionMock).toHaveBeenCalledTimes(1);
    });
    // The page should not crash; the existing photo is still rendered.
    expect(screen.getByText('风景照')).toBeInTheDocument();
  });

  it('invokes OssAction.updatePhoto when a photo is edited', async () => {
    updatePhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 1, name: '改名' }),
    );

    renderPhotos();

    fireEvent.click(screen.getByTestId('edit-photo-btn'));

    await waitFor(() => {
      expect(updatePhotoActionMock).toHaveBeenCalledTimes(1);
    });

    const callArg = updatePhotoActionMock.mock.calls[0]?.[0] as
      | { id: number }
      | undefined;
    expect(callArg?.id).toBe(1);
  });

  it('rolls back the optimistic edit when OssAction.updatePhoto rejects', async () => {
    updatePhotoActionMock.mockRejectedValueOnce(new Error('update boom'));

    renderPhotos();

    fireEvent.click(screen.getByTestId('edit-photo-btn'));

    await waitFor(() => {
      expect(updatePhotoActionMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('风景照')).toBeInTheDocument();
  });

  it('invokes OssAction.deletePhoto with the photo id when delete is confirmed', async () => {
    deletePhotoActionMock.mockResolvedValueOnce(undefined);

    renderPhotos();

    fireEvent.click(screen.getByTestId('delete-photo-btn'));

    await waitFor(() => {
      expect(deletePhotoActionMock).toHaveBeenCalledTimes(1);
    });

    const callArg = deletePhotoActionMock.mock.calls[0]?.[0] as number;
    expect(callArg).toBe(1);
  });

  it('reads the paginated slot that matches the route search params', () => {
    // Both slots are warm on purpose: a page that ignored the
    // router's search params would read the 1 / 20 default slot and
    // render `默认页照片` instead of `第三页照片`.
    renderPhotos({
      search: { page: 3, pageSize: 5 },
      input: { page: 3, pageSize: 5 },
      pagination: buildPaginatedPhotos(
        [buildPhoto({ id: 3, name: '第三页照片' })],
        { page: 3, pageSize: 5, totalPages: 4, total: 16 },
      ),
      extraSlots: [
        {
          input: { page: 1, pageSize: 20 },
          pagination: buildPaginatedPhotos([
            buildPhoto({ id: 1, name: '默认页照片' }),
          ]),
        },
      ],
    });

    expect(photoListQueryOptionsSpy.mock.calls[0]?.[0]).toEqual({
      albumId: undefined,
      page: 3,
      pageSize: 5,
    });
    expect(screen.getByText('第三页照片')).toBeInTheDocument();
    expect(screen.queryByText('默认页照片')).not.toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('3/4');
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('每页5条');
  });

  it('forwards the albumId filter from the route search params into the photos query', () => {
    // The unfiltered 1 / 20 slot stays warm, so a page that dropped
    // the `albumId` filter would silently render the unfiltered list.
    renderPhotos({
      search: { albumId: 7 },
      input: { albumId: 7, page: 1, pageSize: 20 },
      pagination: buildPaginatedPhotos(
        [buildPhoto({ id: 7, name: '相册七照片', albumId: 7 })],
        { page: 1, pageSize: 20, totalPages: 1, total: 1 },
      ),
      extraSlots: [
        {
          input: { page: 1, pageSize: 20 },
          pagination: buildPaginatedPhotos([
            buildPhoto({ id: 1, name: '未过滤照片' }),
          ]),
        },
      ],
    });

    expect(photoListQueryOptionsSpy.mock.calls[0]?.[0]).toEqual({
      albumId: 7,
      page: 1,
      pageSize: 20,
    });
    expect(screen.getByText('相册七照片')).toBeInTheDocument();
    expect(screen.queryByText('未过滤照片')).not.toBeInTheDocument();
  });

  it('drops a non-positive albumId from the route search params', () => {
    renderPhotos({
      search: { albumId: 0, page: 2 },
      input: { page: 2, pageSize: 20 },
      pagination: buildPaginatedPhotos(
        [buildPhoto({ id: 2, name: '第二页照片' })],
        { page: 2, pageSize: 20, totalPages: 3, total: 41 },
      ),
    });

    expect(photoListQueryOptionsSpy.mock.calls[0]?.[0]).toEqual({
      albumId: undefined,
      page: 2,
      pageSize: 20,
    });
    expect(screen.getByText('第二页照片')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('2/3');
  });

  it('creates into the albumId-scoped cache slot, leaving the unfiltered slot untouched', async () => {
    createPhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 99, name: '新建照片', albumId: 7 }),
    );
    const unfilteredSeed = buildPaginatedPhotos([
      buildPhoto({ id: 1, name: '未过滤照片', albumId: null }),
    ]);

    const { queryClient } = renderPhotosWithAlbumFilter(unfilteredSeed);

    fireEvent.click(screen.getByRole('button', { name: '新增' }));

    await waitFor(() => {
      expect(readAlbumSlot(queryClient)?.data.map((p) => p.id)).toEqual([
        7, 99,
      ]);
    });
    expect(queryClient.getQueryData<PaginatedPhotos>(unfilteredKey())).toEqual(
      unfilteredSeed,
    );
  });

  it('updates inside the albumId-scoped cache slot, leaving the unfiltered slot untouched', async () => {
    updatePhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 7, name: '改名', albumId: 7 }),
    );
    const unfilteredSeed = buildPaginatedPhotos([
      buildPhoto({ id: 1, name: '未过滤照片', albumId: null }),
    ]);

    const { queryClient } = renderPhotosWithAlbumFilter(unfilteredSeed);

    fireEvent.click(screen.getByTestId('edit-photo-btn'));

    await waitFor(() => {
      expect(readAlbumSlot(queryClient)?.data.map((p) => p.name)).toEqual([
        '改名',
      ]);
    });
    expect(queryClient.getQueryData<PaginatedPhotos>(unfilteredKey())).toEqual(
      unfilteredSeed,
    );
  });

  it('deletes from the albumId-scoped cache slot, leaving the unfiltered slot untouched', async () => {
    deletePhotoActionMock.mockResolvedValueOnce(undefined);
    const unfilteredSeed = buildPaginatedPhotos([
      buildPhoto({ id: 1, name: '未过滤照片', albumId: null }),
    ]);

    const { queryClient } = renderPhotosWithAlbumFilter(unfilteredSeed);

    fireEvent.click(screen.getByTestId('delete-photo-btn'));

    await waitFor(() => {
      expect(readAlbumSlot(queryClient)?.data).toEqual([]);
    });
    expect(queryClient.getQueryData<PaginatedPhotos>(unfilteredKey())).toEqual(
      unfilteredSeed,
    );
  });

  it('rolls the albumId-scoped slot back to its snapshot when a mutation rejects', async () => {
    deletePhotoActionMock.mockRejectedValueOnce(new Error('delete boom'));
    const unfilteredSeed = buildPaginatedPhotos([
      buildPhoto({ id: 1, name: '未过滤照片', albumId: null }),
    ]);

    const { queryClient } = renderPhotosWithAlbumFilter(unfilteredSeed);

    fireEvent.click(screen.getByTestId('delete-photo-btn'));

    await waitFor(() => {
      expect(deletePhotoActionMock).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(readAlbumSlot(queryClient)?.data.map((p) => p.name)).toEqual([
      '相册七照片',
    ]);
    expect(queryClient.getQueryData<PaginatedPhotos>(unfilteredKey())).toEqual(
      unfilteredSeed,
    );
  });
});
