/*
 * Mocks (external server/query boundary only):
 *   - `@cms/server/albums`     — server function surface
 *   - `@cms/server/photos`     — server function surface
 *   - `@cms/core`              — `OssAction` /
 *                                `PaginationWorkspace` /
 *                                `createSchemaForm` factory are
 *                                exercised as-is; the form factory
 *                                is stubbed because it is a UI-only
 *                                path.
 *   - `@zcat/ui`               — DOM components.
 *   - photo-selector modal     — UI-only.
 *
 * The read-after-write tests unmount and remount the page against
 * the same Query client: the route loader prefetches these slots
 * with `staleTime: 'static'`, so a mutation that never writes the
 * cache is never refetched and the remount would re-serve the
 * unmutated payload.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { photoAlbumDetailQueryOptions } from '@cms/server/albums';
import type { PhotoAlbumDetail } from '@cms/server/albums/schemas';
import {
  emptyAlbumPhotosQueryOptions,
  photoListQueryOptions,
} from '@cms/server/photos';
import type {
  GetPhotosInput,
  PaginatedPhotos,
  Photo,
} from '@cms/server/photos/schemas';

// --- mocks (boundaries only) ---

const {
  getPhotoAlbumMock,
  updatePhotoAlbumMock,
  setPhotoAlbumCoverMock,
  addPhotosMock,
  getPhotosMock,
  getEmptyAlbumPhotosMock,
  createAlbumPhotoActionMock,
  updatePhotoActionMock,
  deletePhotoActionMock,
  schemaFormSubmitQueue,
} = vi.hoisted(() => ({
  getPhotoAlbumMock: vi.fn(),
  updatePhotoAlbumMock: vi.fn(),
  setPhotoAlbumCoverMock: vi.fn(),
  addPhotosMock: vi.fn(),
  getPhotosMock: vi.fn(),
  getEmptyAlbumPhotosMock: vi.fn(),
  createAlbumPhotoActionMock: vi.fn(),
  updatePhotoActionMock: vi.fn(),
  deletePhotoActionMock: vi.fn(),
  schemaFormSubmitQueue: [] as Array<(data: unknown) => Promise<void> | void>,
}));

function flushSchemaFormSubmit(values: unknown) {
  const submit = schemaFormSubmitQueue.shift();
  if (!submit) return;
  void submit(values);
}

vi.mock('@cms/server/albums', async () => {
  const actual =
    await vi.importActual<typeof import('@cms/server/albums')>(
      '@cms/server/albums',
    );
  return {
    ...actual,
    getPhotoAlbum: (...args: unknown[]) => getPhotoAlbumMock(...args),
    updatePhotoAlbum: (...args: unknown[]) => updatePhotoAlbumMock(...args),
    setPhotoAlbumCover: (...args: unknown[]) => setPhotoAlbumCoverMock(...args),
    addPhotos: (...args: unknown[]) => addPhotosMock(...args),
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
  };
});

// Stub only the schema-form factory: it drives a modal/dialog flow
// that we model as a function trigger in the test. The real
// implementation opens a `ZDialog` and only calls `onSubmit`
// after the user submits the form. Our mock mirrors that
// lifecycle by capturing the `onSubmit` callback in a queue so
// tests can invoke it directly with values.
vi.mock('@cms/core', async () => {
  const actual = await vi.importActual<typeof import('@cms/core')>('@cms/core');
  return {
    ...actual,
    OssAction: {
      createAlbumPhoto: (...args: unknown[]) =>
        createAlbumPhotoActionMock(...args),
      updatePhoto: (...args: unknown[]) => updatePhotoActionMock(...args),
      deletePhoto: (...args: unknown[]) => deletePhotoActionMock(...args),
    },
    createSchemaForm:
      () =>
      (options: { onSubmit: (data: unknown) => Promise<void> | void }) => {
        return (values?: unknown) => {
          schemaFormSubmitQueue.push(options.onSubmit);
          // The real factory opens a `ZDialog` and waits for the
          // user to confirm. In tests we let the test drive the
          // dialog submit step. If the caller invokes the trigger
          // with values, we treat that as an "auto-confirm" so the
          // existing list page tests keep working.
          if (values !== undefined) {
            flushSchemaFormSubmit(values);
          }
        };
      },
    PaginationWorkspace: ({
      title,
      description,
      page,
      pageSize,
      totalPages,
      operation,
      children,
    }: {
      title: string;
      description?: string;
      page: number;
      pageSize: number;
      totalPages: number;
      children?: React.ReactNode;
      operation?: React.ReactNode;
    }) => (
      <div data-testid="PaginationWorkspace">
        <h1>{title}</h1>
        {description && (
          <p data-testid="workspace-description">{description}</p>
        )}
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

const showPhotoSelectorMock = vi.fn();

vi.mock('@cms/features/album/components/album', () => ({
  PhotoCard: ({
    data,
    onEdit,
    onDelete,
    hoverComponent,
  }: {
    data: Photo & { loading?: boolean };
    onEdit: (data: Photo) => void;
    onDelete: (data: Photo) => void;
    hoverComponent?: React.ReactNode;
  }) => (
    <div data-testid="photo-card" data-id={data.id}>
      <span>{data.name}</span>
      <button data-testid="edit-photo-btn" onClick={() => onEdit(data)}>
        编辑
      </button>
      <button data-testid="delete-photo-btn" onClick={() => onDelete(data)}>
        删除
      </button>
      {hoverComponent}
    </div>
  ),
  showPhotoSelector: (...args: unknown[]) => showPhotoSelectorMock(...args),
}));

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
  safeNumber: (v: unknown, d: number) => {
    const n = Number(v);
    return Number.isNaN(n) ? d : n;
  },
  usePropsValue: <T,>(value: T) => value,
}));

// --- import after mocks ---

import AlbumsId from './albums.id';

function buildAlbumDetail(
  overrides: Partial<PhotoAlbumDetail> = {},
): PhotoAlbumDetail {
  return {
    id: 1,
    name: '旅行相册',
    description: '记录旅行的美好瞬间',
    available: true,
    coverId: null,
    createdAt: '2025-02-15T00:00:00.000Z',
    updatedAt: '2025-02-15T00:00:00.000Z',
    ...overrides,
  };
}

function buildPhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: 1,
    name: '风景照',
    url: 'photos/1.jpg',
    thumbnailUrl: 'photos/thumb_1.jpg',
    signedUrl: 'https://signed.example/photos/1.jpg',
    signedThumbnailUrl: 'https://signed.example/photos/thumb_1.jpg',
    albumId: 1,
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

interface SeedOverrides {
  album?: PhotoAlbumDetail;
  albumId?: number;
  photos?: PaginatedPhotos;
  reminder?: Photo[];
  input?: Partial<GetPhotosInput>;
  search?: Record<string, unknown>;
}

function renderAlbumsIdWithClient(
  queryClient: QueryClient,
  albumId: number,
  search: Record<string, unknown> = {},
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AlbumsId albumId={albumId} search={search} />
    </QueryClientProvider>,
  );
}

function renderAlbumsId(overrides: SeedOverrides = {}) {
  const albumId = overrides.albumId ?? 1;
  const album = overrides.album ?? buildAlbumDetail({ id: albumId });
  const input = overrides.input ?? { albumId, page: 1, pageSize: 20 };
  const photos = overrides.photos ?? buildPaginatedPhotos([]);
  const reminder = overrides.reminder ?? [];
  const search = overrides.search ?? {};

  // `staleTime: 'static'` mirrors the route loader, which prefetches
  // these three slots exactly that way. A remount therefore re-serves
  // the cache instead of refetching — which is the only way the
  // read-after-write defect is observable.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 'static' } },
  });
  queryClient.setQueryData(
    photoAlbumDetailQueryOptions({ id: albumId }).queryKey,
    album,
  );
  queryClient.setQueryData(photoListQueryOptions(input).queryKey, photos);
  queryClient.setQueryData(emptyAlbumPhotosQueryOptions().queryKey, reminder);

  return {
    queryClient,
    albumId,
    ...renderAlbumsIdWithClient(queryClient, albumId, search),
  };
}

describe('AlbumsId detail page', () => {
  beforeEach(() => {
    // Each test pre-stages its own mock behaviour. Reset the
    // invocation history so the previous test's `mockResolvedValueOnce`
    // / `mockRejectedValueOnce` does not leak.
    getPhotoAlbumMock.mockReset();
    updatePhotoAlbumMock.mockReset();
    setPhotoAlbumCoverMock.mockReset();
    addPhotosMock.mockReset();
    getPhotosMock.mockReset();
    getEmptyAlbumPhotosMock.mockReset();
    createAlbumPhotoActionMock.mockReset();
    updatePhotoActionMock.mockReset();
    deletePhotoActionMock.mockReset();
    showPhotoSelectorMock.mockReset();
  });

  it('renders the album header and description from Query cache', () => {
    renderAlbumsId({
      album: buildAlbumDetail({
        name: '旅行相册',
        description: '记录旅行的美好瞬间',
      }),
    });

    expect(screen.getByText('相册名称：旅行相册')).toBeInTheDocument();
    expect(
      screen.getByText('相册描述：记录旅行的美好瞬间'),
    ).toBeInTheDocument();
  });

  it('renders the empty photo grid when the cache has no photos', () => {
    renderAlbumsId();
    expect(screen.getByTestId('ZGrid')).toBeInTheDocument();
    expect(screen.queryByTestId('photo-card')).not.toBeInTheDocument();
  });

  it('renders photo cards from the Query cache', () => {
    renderAlbumsId({
      photos: buildPaginatedPhotos([
        buildPhoto({ id: 1, name: '风景照' }),
        buildPhoto({ id: 2, name: '人物照', url: 'photos/2.jpg' }),
      ]),
    });

    expect(screen.getByText('风景照')).toBeInTheDocument();
    expect(screen.getByText('人物照')).toBeInTheDocument();
  });

  it('calls setPhotoAlbumCover when a "设为封面" button is clicked', async () => {
    setPhotoAlbumCoverMock.mockResolvedValueOnce(undefined);

    renderAlbumsId({
      albumId: 5,
      album: buildAlbumDetail({ id: 5, coverId: null }),
      photos: buildPaginatedPhotos([buildPhoto({ id: 9, albumId: 5 })]),
    });

    fireEvent.click(screen.getByRole('button', { name: '设为封面' }));

    await waitFor(() => {
      expect(setPhotoAlbumCoverMock).toHaveBeenCalledTimes(1);
    });

    const callArg = setPhotoAlbumCoverMock.mock.calls[0]?.[0] as
      | { data: { albumId: number; photoId: number } }
      | undefined;
    expect(callArg?.data).toEqual({ albumId: 5, photoId: 9 });
  });

  it('opens the photo selector and posts the selected photos to addPhotos', async () => {
    const selected: Photo[] = [buildPhoto({ id: 100, name: '待关联照片' })];
    showPhotoSelectorMock.mockResolvedValueOnce(selected);
    addPhotosMock.mockResolvedValueOnce(undefined);

    renderAlbumsId({
      albumId: 3,
      album: buildAlbumDetail({ id: 3 }),
      reminder: [buildPhoto({ id: 100, albumId: null, name: '待关联照片' })],
    });

    fireEvent.click(screen.getByRole('button', { name: '选择照片' }));

    await waitFor(() => {
      expect(showPhotoSelectorMock).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(addPhotosMock).toHaveBeenCalledTimes(1);
    });

    const callArg = addPhotosMock.mock.calls[0]?.[0] as
      | { data: { albumId: number; photoIds: number[] } }
      | undefined;
    expect(callArg?.data.albumId).toBe(3);
    expect(callArg?.data.photoIds).toEqual([100]);
  });

  it('posts the create album photo payload to OssAction.createAlbumPhoto', async () => {
    createAlbumPhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 200, name: '新建照片' }),
    );

    renderAlbumsId({
      albumId: 1,
      album: buildAlbumDetail({ id: 1 }),
    });

    // Open the schema-form dialog and submit the form with valid
    // values — the page wires `addPhoto()` through the form's
    // `useSchemaForm` factory, which opens a `ZDialog` and only
    // calls `onSubmit` after the user confirms. The test mock
    // models that lifecycle by queueing the submit callback; the
    // test triggers the dialog open here and then flushes the
    // submit with the expected form payload.
    fireEvent.click(screen.getByRole('button', { name: '添加照片' }));
    flushSchemaFormSubmit({
      id: 0,
      name: '新建照片',
      image: 'photos/upload.jpg',
      albumId: 1,
    });

    await waitFor(() => {
      expect(createAlbumPhotoActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not crash when OssAction.createAlbumPhoto rejects', async () => {
    createAlbumPhotoActionMock.mockRejectedValueOnce(new Error('upload boom'));

    renderAlbumsId({
      albumId: 1,
      album: buildAlbumDetail({ id: 1 }),
    });

    fireEvent.click(screen.getByRole('button', { name: '添加照片' }));
    flushSchemaFormSubmit({
      id: 0,
      name: '新建照片',
      image: 'photos/upload.jpg',
      albumId: 1,
    });

    await waitFor(() => {
      expect(createAlbumPhotoActionMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('相册名称：旅行相册')).toBeInTheDocument();
  });

  it('posts the update photo payload to OssAction.updatePhoto', async () => {
    updatePhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 1, name: '改名' }),
    );

    renderAlbumsId({
      photos: buildPaginatedPhotos([buildPhoto({ id: 1, name: '风景照' })]),
    });

    fireEvent.click(screen.getByTestId('edit-photo-btn'));

    await waitFor(() => {
      expect(updatePhotoActionMock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not crash when OssAction.updatePhoto rejects', async () => {
    updatePhotoActionMock.mockRejectedValueOnce(new Error('update boom'));

    renderAlbumsId({
      photos: buildPaginatedPhotos([buildPhoto({ id: 1, name: '风景照' })]),
    });

    fireEvent.click(screen.getByTestId('edit-photo-btn'));

    await waitFor(() => {
      expect(updatePhotoActionMock).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('相册名称：旅行相册')).toBeInTheDocument();
  });

  it('removes the photo through OssAction.deletePhoto after confirmation', async () => {
    deletePhotoActionMock.mockResolvedValueOnce(undefined);

    renderAlbumsId({
      photos: buildPaginatedPhotos([
        buildPhoto({ id: 50, name: '待删除照片' }),
      ]),
    });

    fireEvent.click(screen.getByTestId('delete-photo-btn'));

    await waitFor(() => {
      expect(deletePhotoActionMock).toHaveBeenCalledTimes(1);
    });

    const callArg = deletePhotoActionMock.mock.calls[0] as unknown[];
    expect(callArg?.[0]).toBe(50);
  });

  it('serves the created photo from the Query cache after unmount and remount', async () => {
    createAlbumPhotoActionMock.mockResolvedValueOnce(
      buildPhoto({ id: 200, name: '新建照片' }),
    );

    const { queryClient, albumId, unmount } = renderAlbumsId({
      albumId: 1,
      album: buildAlbumDetail({ id: 1 }),
    });

    fireEvent.click(screen.getByRole('button', { name: '添加照片' }));
    flushSchemaFormSubmit({
      id: 0,
      name: '新建照片',
      image: 'photos/upload.jpg',
      albumId: 1,
    });

    await waitFor(() => {
      expect(createAlbumPhotoActionMock).toHaveBeenCalledTimes(1);
    });

    // The loader prefetched this slot with `staleTime: 'static'`, so
    // the remount is served from the cache. A mutation that only
    // touched React-local state loses the photo here.
    unmount();
    renderAlbumsIdWithClient(queryClient, albumId);

    expect(screen.getByText('新建照片')).toBeInTheDocument();
  });

  it('serves the photo as deleted from the Query cache after unmount and remount', async () => {
    deletePhotoActionMock.mockResolvedValueOnce(undefined);

    const { queryClient, albumId, unmount } = renderAlbumsId({
      albumId: 1,
      album: buildAlbumDetail({ id: 1 }),
      photos: buildPaginatedPhotos([
        buildPhoto({ id: 50, name: '待删除照片' }),
        buildPhoto({ id: 51, name: '保留照片' }),
      ]),
    });

    fireEvent.click(screen.getAllByTestId('delete-photo-btn')[0]);

    await waitFor(() => {
      expect(deletePhotoActionMock).toHaveBeenCalledTimes(1);
    });

    unmount();
    renderAlbumsIdWithClient(queryClient, albumId);

    expect(screen.queryByText('待删除照片')).not.toBeInTheDocument();
    expect(screen.getByText('保留照片')).toBeInTheDocument();
  });

  it('serves the renamed album from the Query cache after unmount and remount', async () => {
    updatePhotoAlbumMock.mockResolvedValueOnce(
      buildAlbumDetail({ id: 1, name: '旅行相册-改名' }),
    );

    const { queryClient, albumId, unmount } = renderAlbumsId({
      albumId: 1,
      album: buildAlbumDetail({ id: 1, name: '旅行相册' }),
    });

    fireEvent.click(screen.getByRole('button', { name: '编辑相册' }));

    await waitFor(() => {
      expect(updatePhotoAlbumMock).toHaveBeenCalledTimes(1);
    });

    unmount();
    renderAlbumsIdWithClient(queryClient, albumId);

    expect(screen.getByText('相册名称：旅行相册-改名')).toBeInTheDocument();
  });
});
