import { isRedirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pageParamSchema } from '@blog/common';

const { getGalleryListMock } = vi.hoisted(() => ({
  getGalleryListMock: vi.fn(),
}));

vi.mock('@blog/server/gallery', async () => {
  const actual = await vi.importActual<typeof import('@blog/server/gallery')>(
    '@blog/server/gallery',
  );
  return {
    ...actual,
    getGalleryList: (...args: unknown[]) => getGalleryListMock(...args),
  };
});

// --- import after mocks ---

import { Route, loader } from './gallery';

const GALLERY_LIST = {
  data: [
    {
      id: 3,
      name: '旅行',
      description: '在路上',
      cover: {
        id: 30,
        name: 'cover.jpg',
        url: 'photos/30.jpg',
        signedUrl: 'https://bucket.example/30.jpg?sig=1',
        signedThumbnailUrl: 'https://bucket.example/30.thumbnail.jpg?sig=1',
        thumbnailUrl: 'photos/30-thumb.jpg',
        albumId: 3,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 4,
      name: '日常',
      description: '没有封面',
      cover: null,
    },
  ],
  total: 7,
  totalPages: 4,
  page: 1,
  pageSize: 8,
};

describe('route loader: /_blog/gallery', () => {
  beforeEach(() => {
    getGalleryListMock.mockReset();
    getGalleryListMock.mockResolvedValue(GALLERY_LIST);
  });

  it('resolves the gallery payload exactly as the backend sends it', async () => {
    const result = await loader({ search: {} });

    expect(result.pagination).toEqual(GALLERY_LIST);
    expect(result.pagination.data.map((gallery) => gallery.id)).toEqual([3, 4]);
    expect(result.pagination.data[0]?.cover?.id).toBe(30);
    expect(result.pagination.data[1]?.cover).toBeNull();
  });

  it('exposes both the grand total and the page count, so a page count is derivable', async () => {
    const result = await loader({ search: {} });

    expect(result.pagination.total).toBe(7);
    expect(result.pagination.totalPages).toBe(4);
    expect(result.pagination.total).not.toBe(result.pagination.data.length);
  });

  it('requests the first gallery page when the search param is absent', async () => {
    const result = await loader({ search: {} });

    expect(getGalleryListMock).toHaveBeenCalledTimes(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1 },
    });
    expect(result.page).toBe(1);
  });

  it('passes the requested page from the URL search param straight through to the backend', async () => {
    getGalleryListMock.mockResolvedValue({
      ...GALLERY_LIST,
      page: 3,
    });

    const result = await loader({ search: { page: '3' } });

    expect(getGalleryListMock).toHaveBeenCalledTimes(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 3 },
    });
    expect(result.page).toBe(3);
  });

  it('accepts a numeric page param the way TanStack Router parses it from a real URL', async () => {
    getGalleryListMock.mockResolvedValue({
      ...GALLERY_LIST,
      page: 3,
    });

    const result = await loader({ search: { page: 3 } });

    expect(result.page).toBe(3);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 3 },
    });
  });

  it('redirects an out-of-range request to the last available page', async () => {
    getGalleryListMock.mockResolvedValue({
      ...GALLERY_LIST,
      total: 25,
      totalPages: 4,
      page: 9,
      data: [],
    });

    let error: unknown;
    try {
      await loader({ search: { page: '9' } });
    } catch (caught) {
      error = caught;
    }

    expect(getGalleryListMock).toHaveBeenCalledTimes(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 9 },
    });
    expect(isRedirect(error)).toBe(true);

    if (!isRedirect(error)) {
      return;
    }
    expect(error.options.to).toBe('/gallery');
    expect(error.options.search).toEqual({ page: '4' });
    expect(error.options.replace).toBe(true);
  });
});

describe('route search validation: /_blog/gallery', () => {
  it('wires the shared page param schema as validateSearch', () => {
    expect(Route.options.validateSearch).toBe(pageParamSchema);
  });
});
