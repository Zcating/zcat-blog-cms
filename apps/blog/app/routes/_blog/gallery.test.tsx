import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { defaultParseSearch } from '@tanstack/react-router';

import { Route, loader } from './gallery';

interface GallerySearchParams {
  page?: number;
}

function parseRealUrl(search: string): Record<string, string | number> {
  return defaultParseSearch(search) as Record<string, string | number>;
}

function validateSearch(search: Record<string, unknown>): GallerySearchParams {
  const schema = Route.options.validateSearch;
  if (schema === undefined || !('parse' in schema)) {
    throw new Error('/_blog/gallery must declare an object validateSearch');
  }
  return schema.parse(search) as GallerySearchParams;
}

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

  it('falls back to the first page when the page search param is not a positive number', async () => {
    const result = await loader({ search: { page: 'not-a-page' } });

    expect(result.page).toBe(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1 },
    });
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

  it('clamps the visible page to the last available page when the URL is past the end', async () => {
    getGalleryListMock.mockResolvedValue({
      ...GALLERY_LIST,
      total: 25,
      totalPages: 4,
      page: 9,
      data: [],
    });

    const result = await loader({ search: { page: '9' } });

    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 9 },
    });
    expect(result.page).toBe(4);
  });
});

describe('route search validation: /_blog/gallery', () => {
  beforeEach(() => {
    getGalleryListMock.mockReset();
    getGalleryListMock.mockResolvedValue(GALLERY_LIST);
  });

  it('accepts a mistyped ?page= from a real URL and falls back to page 1 instead of throwing a search param error', async () => {
    const search = parseRealUrl('?page=not-a-page');
    expect(typeof search.page).toBe('string');

    expect(() => validateSearch(search)).not.toThrow();
    const validated = validateSearch(search);
    expect(validated.page).toBeUndefined();

    const result = await loader({ search: { page: validated.page } });

    expect(result.page).toBe(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1 },
    });
  });

  it('admits a zero or negative ?page= and lets the loader sanitiser clamp it to page 1', async () => {
    const zero = parseRealUrl('?page=0');
    const negative = parseRealUrl('?page=-3');
    expect(zero.page).toBe(0);
    expect(negative.page).toBe(-3);

    expect(() => validateSearch(zero)).not.toThrow();
    expect(() => validateSearch(negative)).not.toThrow();
    expect(validateSearch(zero).page).toBe(0);
    expect(validateSearch(negative).page).toBe(-3);

    expect((await loader({ search: { page: 0 } })).page).toBe(1);
    expect((await loader({ search: { page: -3 } })).page).toBe(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1 },
    });
  });

  it('still serves the requested page for a numeric ?page= the router parses out of a real URL', async () => {
    const search = parseRealUrl('?page=3');
    expect(search.page).toBe(3);

    const validated = validateSearch(search);
    expect(validated.page).toBe(3);

    const result = await loader({ search: { page: validated.page } });

    expect(result.page).toBe(3);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 3 },
    });
  });
});
