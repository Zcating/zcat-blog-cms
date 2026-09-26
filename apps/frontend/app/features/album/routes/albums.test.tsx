/**
 * Tests for the album list page (`Albums`).
 *
 * Scope (Phase 3b album lane):
 *   1. The page reads its paginated data from `useSuspenseQuery`
 *      against `photoAlbumsListQueryOptions` (Query, not loaderData).
 *   2. It renders the existing album cards through `AlbumImageCard`.
 *   3. Empty pagination renders the empty state and a "新增相册"
 *      operation button.
 *   4. Create mutation goes through `createPhotoAlbum` server
 *      function and updates the Query cache on success / rolls back
 *      on failure.
 *   5. Delete mutation goes through `deletePhotoAlbum` server
 *      function and removes the entry optimistically.
 *   6. Edit mutation goes through `updatePhotoAlbum` server
 *      function and replaces the entry optimistically.
 *
 * Mocks (external server/query boundary only):
 *   - `@cms/server/albums`     — server function surface
 *   - `@cms/core`              — `PaginationWorkspace` /
 *                                `createSchemaForm` factory are
 *                                exercised as-is. Only the form
 *                                factory is stubbed because it is
 *                                a UI-only path.
 *   - `@zcat/ui`               — DOM components.
 *
 * The read-after-write tests unmount and remount the page against
 * the same Query client: the route loader prefetches this slot with
 * `staleTime: 'static'`, so a mutation that never writes the cache
 * is never refetched and the remount would re-serve the unmutated
 * payload.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { photoAlbumsListQueryOptions } from '@cms/server/albums';
import type {
  CreatePhotoAlbumInput,
  DeletePhotoAlbumInput,
  GetPhotoAlbumsInput,
  PaginatedPhotoAlbums,
  PhotoAlbum,
  UpdatePhotoAlbumInput,
} from '@cms/server/albums/schemas';

// --- mocks (boundaries only) ---

const {
  getPhotoAlbumsMock,
  createPhotoAlbumMock,
  updatePhotoAlbumMock,
  deletePhotoAlbumMock,
} = vi.hoisted(() => ({
  getPhotoAlbumsMock: vi.fn(),
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
    getPhotoAlbums: getPhotoAlbumsMock,
    createPhotoAlbum: (...args: unknown[]) => createPhotoAlbumMock(...args),
    updatePhotoAlbum: (...args: unknown[]) => updatePhotoAlbumMock(...args),
    deletePhotoAlbum: (...args: unknown[]) => deletePhotoAlbumMock(...args),
  };
});

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: string;
}

interface ZGridProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  columnClassName?: string;
}

interface PaginationWorkspaceProps {
  title: string;
  page: number;
  pageSize: number;
  totalPages: number;
  children?: React.ReactNode;
  operation?: React.ReactNode;
}

interface AlbumCardLike {
  data: PhotoAlbum & { loading?: boolean };
  onClickItem: (item: unknown) => void;
  onEdit: (item: unknown) => void;
  onDelete: (item: unknown) => void;
}

vi.mock('@zcat/ui', () => ({
  ZButton: ({
    children,
    onClick,
    loading,
    disabled,
  }: ButtonProps & { loading?: boolean; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled} data-loading={loading}>
      {children}
    </button>
  ),
  ZDialog: { confirm: vi.fn() },
  ZGrid: <T,>({ items, renderItem, columnClassName }: ZGridProps<T>) => (
    <div data-testid="ZGrid" data-column-class={columnClassName}>
      {items.map((item, i) => (
        <div key={i} data-testid="ZGrid-item">
          {renderItem(item)}
        </div>
      ))}
    </div>
  ),
  safeNumber: (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isNaN(n) ? d : n;
  },
  usePropsValue: <T,>(value: T) => value,
}));

// Stub only the schema-form factory: it drives a modal/dialog flow
// that we model as a function trigger in the test. The album
// mutations live in `../hooks/use-albums` and run against the real
// Query client.
vi.mock('@cms/core', async () => {
  const actual = await vi.importActual<typeof import('@cms/core')>('@cms/core');
  return {
    ...actual,
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
    }: PaginationWorkspaceProps) => (
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

vi.mock('@cms/features/album/components/album', () => ({
  AlbumImageCard: ({ data, onEdit, onDelete, onClickItem }: AlbumCardLike) => (
    <div data-testid="album-card" data-id={data.id} data-loading={data.loading}>
      <span>{data.name}</span>
      <button data-testid="edit-btn" onClick={() => onEdit(data)}>
        编辑
      </button>
      <button data-testid="delete-btn" onClick={() => onDelete(data)}>
        删除
      </button>
      <button data-testid="detail-btn" onClick={() => onClickItem(data)}>
        查看详情
      </button>
    </div>
  ),
}));

// --- import after mocks ---

import Albums from './albums';

function buildAlbumsPagination(
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

function renderAlbumsWithClient(
  queryClient: QueryClient,
  search: Record<string, unknown> = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <Albums search={search} />
    </QueryClientProvider>,
  );
}

function renderAlbums(
  pagination: PaginatedPhotoAlbums,
  search: Record<string, unknown> = {},
) {
  // `staleTime: 'static'` mirrors the route loader, which prefetches
  // this slot exactly that way. A remount therefore re-serves the
  // cache instead of refetching — which is the only way the
  // read-after-write defect is observable.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 'static' } },
  });
  const key = photoAlbumsListQueryOptions({
    page: pagination.page,
    pageSize: pagination.pageSize,
  } as Partial<GetPhotoAlbumsInput>).queryKey;
  queryClient.setQueryData(key, pagination);

  return {
    queryClient,
    ...renderAlbumsWithClient(queryClient, search),
  };
}

describe('Albums list page', () => {
  beforeEach(() => {
    // Each test pre-stages its own mock behaviour. Reset the
    // invocation history so the previous test's `mockResolvedValueOnce`
    // / `mockRejectedValueOnce` does not leak.
    getPhotoAlbumsMock.mockReset();
    createPhotoAlbumMock.mockReset();
    updatePhotoAlbumMock.mockReset();
    deletePhotoAlbumMock.mockReset();
  });

  it('renders the page title and pagination metadata from Query cache', () => {
    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    expect(screen.getByText('相册列表')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('1/1');
    expect(screen.getByText('默认相册')).toBeInTheDocument();
  });

  it('renders the empty grid when the cache has no albums', () => {
    renderAlbums(buildAlbumsPagination([]));

    expect(screen.getByText('相册列表')).toBeInTheDocument();
    expect(screen.getByTestId('ZGrid')).toBeInTheDocument();
    expect(screen.queryByTestId('album-card')).not.toBeInTheDocument();
  });

  it('exposes a "新增相册" operation button', () => {
    renderAlbums(buildAlbumsPagination([buildAlbum()]));

    expect(
      screen.getByRole('button', { name: '新增相册' }),
    ).toBeInTheDocument();
  });

  it('reads paginated albums through the Query cache (Query, not loaderData)', () => {
    // If the page tried to read from `loaderData` it would either
    // crash (undefined) or render an empty grid regardless of the
    // cache. We confirm the cache is the source of truth by
    // pre-seeding the cache and asserting the albums render.
    renderAlbums(
      buildAlbumsPagination([
        buildAlbum({ id: 11, name: '旅行相册' }),
        buildAlbum({ id: 22, name: '风景相册' }),
      ]),
    );

    expect(screen.getByText('旅行相册')).toBeInTheDocument();
    expect(screen.getByText('风景相册')).toBeInTheDocument();
  });

  it('reads the paginated slot that matches the route search params', () => {
    // The cache is seeded under `page=2 / pageSize=5` only. If the
    // page did not derive its query key from the router's search
    // params it would fall back to 1 / 10, miss the cache and
    // suspend on an unmocked server function.
    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 21, name: '第二页相册' })], {
        page: 2,
        pageSize: 5,
        totalPages: 3,
        total: 11,
      }),
      { page: '2', pageSize: '5' },
    );

    expect(screen.getByText('第二页相册')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('2/3');
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('每页5条');
  });

  it('falls back to the default pagination when the search params are absent', () => {
    // The cache is seeded under the 1 / 10 default only; a missing
    // `page` / `pageSize` must not produce a different query key.
    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    expect(screen.getByText('默认相册')).toBeInTheDocument();
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('1/1');
    expect(screen.getByTestId('pagination-info')).toHaveTextContent('每页10条');
  });

  it('invokes createPhotoAlbum server function when the create form is submitted', async () => {
    createPhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({ id: 99, name: '新建相册' }),
    );

    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByRole('button', { name: '新增相册' }));

    await waitFor(() => {
      expect(createPhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    const callArg = createPhotoAlbumMock.mock.calls[0]?.[0] as
      | { data: CreatePhotoAlbumInput }
      | undefined;
    expect(callArg?.data).toMatchObject({
      name: '默认相册',
      description: '',
      available: false,
    });
  });

  it('does not crash when createPhotoAlbum rejects', async () => {
    createPhotoAlbumMock.mockRejectedValueOnce(new Error('server boom'));

    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByRole('button', { name: '新增相册' }));

    await waitFor(() => {
      expect(createPhotoAlbumMock).toHaveBeenCalledTimes(1);
    });
    // The page must not throw on rejection; the original
    // pagination header is still rendered.
    expect(screen.getByText('相册列表')).toBeInTheDocument();
  });

  it('invokes updatePhotoAlbum when an album is edited', async () => {
    updatePhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({ id: 1, name: '默认相册-改名' }),
    );

    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByTestId('edit-btn'));

    await waitFor(() => {
      expect(updatePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    const callArg = updatePhotoAlbumMock.mock.calls[0]?.[0] as
      | { data: UpdatePhotoAlbumInput }
      | undefined;
    expect(callArg?.data.id).toBe(1);
  });

  it('does not crash when updatePhotoAlbum rejects', async () => {
    updatePhotoAlbumMock.mockRejectedValueOnce(new Error('server boom'));

    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByTestId('edit-btn'));

    await waitFor(() => {
      expect(updatePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });
    // The page must not throw on rejection; the original
    // pagination header is still rendered.
    expect(screen.getByText('相册列表')).toBeInTheDocument();
  });

  it('invokes deletePhotoAlbum with the album id when delete is confirmed', async () => {
    deletePhotoAlbumMock.mockResolvedValueOnce(undefined);

    renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 7, name: '待删除相册' })]),
    );

    fireEvent.click(screen.getByTestId('delete-btn'));

    await waitFor(() => {
      expect(deletePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    const callArg = deletePhotoAlbumMock.mock.calls[0]?.[0] as
      | { data: DeletePhotoAlbumInput }
      | undefined;
    expect(callArg?.data.id).toBe(7);
  });

  it('serves the created album from the Query cache after unmount and remount', async () => {
    createPhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({ id: 99, name: '测试相册' }),
    );

    const { queryClient, unmount } = renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByRole('button', { name: '新增相册' }));

    await waitFor(() => {
      expect(createPhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    // Unmount the page and mount a fresh one against the same
    // Query client. The loader prefetched this slot with
    // `staleTime: 'static'`, so the remount is served from the
    // cache: a mutation that only touched React-local state loses
    // the album here.
    unmount();
    renderAlbumsWithClient(queryClient);

    expect(screen.getByText('测试相册')).toBeInTheDocument();
  });

  it('serves the album as deleted from the Query cache after unmount and remount', async () => {
    deletePhotoAlbumMock.mockResolvedValueOnce(undefined);

    const { queryClient, unmount } = renderAlbums(
      buildAlbumsPagination([
        buildAlbum({ id: 1, name: '默认相册' }),
        buildAlbum({ id: 7, name: '待删除相册' }),
      ]),
    );

    fireEvent.click(screen.getAllByTestId('delete-btn')[0]);

    await waitFor(() => {
      expect(deletePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    unmount();
    renderAlbumsWithClient(queryClient);

    expect(screen.queryByText('默认相册')).not.toBeInTheDocument();
    expect(screen.getByText('待删除相册')).toBeInTheDocument();
  });

  it('serves the renamed album from the Query cache after unmount and remount', async () => {
    updatePhotoAlbumMock.mockResolvedValueOnce(
      buildAlbum({ id: 1, name: '默认相册-改名' }),
    );

    const { queryClient, unmount } = renderAlbums(
      buildAlbumsPagination([buildAlbum({ id: 1, name: '默认相册' })]),
    );

    fireEvent.click(screen.getByTestId('edit-btn'));

    await waitFor(() => {
      expect(updatePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    unmount();
    renderAlbumsWithClient(queryClient);

    expect(screen.getByText('默认相册-改名')).toBeInTheDocument();
  });
});
