import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGalleryDetailMock } = vi.hoisted(() => ({
  getGalleryDetailMock: vi.fn(),
}));

vi.mock('@blog/server/gallery', async () => {
  const actual = await vi.importActual<typeof import('@blog/server/gallery')>(
    '@blog/server/gallery',
  );
  return {
    ...actual,
    getGalleryDetail: (...args: unknown[]) => getGalleryDetailMock(...args),
  };
});

// --- import after mocks ---

import { Route, loader } from './gallery_.$id';

const GALLERY_DETAIL = {
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
  photos: [
    {
      id: 30,
      name: 'cover.jpg',
      url: 'https://example.com/30.jpg',
      thumbnailUrl: 'https://example.com/30-thumb.jpg',
      albumId: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 31,
      name: 'street.jpg',
      url: 'https://example.com/31.jpg',
      thumbnailUrl: 'https://example.com/31-thumb.jpg',
      albumId: 3,
      createdAt: '2026-01-03T00:00:00.000Z',
      updatedAt: '2026-01-03T00:00:00.000Z',
    },
  ],
};

describe('route loader: /_blog/gallery/$id', () => {
  beforeEach(() => {
    getGalleryDetailMock.mockReset();
    getGalleryDetailMock.mockResolvedValue(GALLERY_DETAIL);
  });

  it('forwards the raw URL id segment as a string, without coercing it to a number', async () => {
    const result = await loader({ params: { id: '3' } });

    expect(getGalleryDetailMock).toHaveBeenCalledTimes(1);
    expect(getGalleryDetailMock.mock.calls[0]?.[0]).toEqual({
      data: { id: '3' },
    });
    expect(result.gallery).toEqual(GALLERY_DETAIL);
  });

  it('rejects an id outside the id contract without calling the backend', async () => {
    await expect(loader({ params: { id: '3/4' } })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getGalleryDetailMock).not.toHaveBeenCalled();
  });

  it('rejects a missing id parameter without calling the backend', async () => {
    await expect(loader({ params: {} })).rejects.toMatchObject({
      isNotFound: true,
    });
    expect(getGalleryDetailMock).not.toHaveBeenCalled();
  });

  it('wires both boundaries, so a backend failure cannot fall through to the root error screen', () => {
    expect(Route.options.notFoundComponent).toBeTypeOf('function');
    expect(Route.options.errorComponent).toBeTypeOf('function');
  });
});
