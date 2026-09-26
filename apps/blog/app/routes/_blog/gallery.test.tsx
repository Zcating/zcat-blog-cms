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

import { loader } from './gallery';

const GALLERY_LIST = {
  data: [
    {
      id: 3,
      name: '旅行',
      description: '在路上',
      cover: {
        id: 30,
        name: 'cover.jpg',
        url: 'https://example.com/30.jpg',
        thumbnailUrl: 'https://example.com/30-thumb.jpg',
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
  total: 2,
  page: 1,
  pageSize: 8,
};

describe('route loader: /_blog/gallery', () => {
  beforeEach(() => {
    getGalleryListMock.mockReset();
    getGalleryListMock.mockResolvedValue(GALLERY_LIST);
  });

  it('resolves the gallery payload exactly as the backend sends it', async () => {
    const result = await loader();

    expect(result.pagination).toEqual(GALLERY_LIST);
    expect(result.pagination.data.map((gallery) => gallery.id)).toEqual([3, 4]);
    expect(result.pagination.data[0]?.cover?.id).toBe(30);
    expect(result.pagination.data[1]?.cover).toBeNull();
  });

  it('exposes total instead of totalPages, so no page count can be derived', async () => {
    const result = await loader();

    expect(result.pagination.total).toBe(2);
    expect(result.pagination).not.toHaveProperty('totalPages');
  });

  it('requests the first gallery page', async () => {
    await loader();

    expect(getGalleryListMock).toHaveBeenCalledTimes(1);
    expect(getGalleryListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1 },
    });
  });
});
