import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getGalleryListMock, useNavigateMock } = vi.hoisted(() => ({
  getGalleryListMock: vi.fn(),
  useNavigateMock: vi.fn(),
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

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    useNavigate: () => useNavigateMock,
  };
});

// --- import after mocks ---

import { Route } from './gallery';

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
      },
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

describe('route component: /_blog/gallery', () => {
  beforeEach(() => {
    getGalleryListMock.mockReset();
    useNavigateMock.mockReset();
  });

  it('renders one card per gallery, using the gallery id from the payload', () => {
    const spy = vi
      .spyOn(Route, 'useLoaderData')
      .mockReturnValue({ pagination: GALLERY_LIST });
    const GalleryPage = Route.options.component;
    if (!GalleryPage) throw new Error('gallery route has no component');

    render(<GalleryPage />);

    expect(screen.getByText('一些我拍的照片')).toBeInTheDocument();
    expect(screen.getByText('旅行')).toBeInTheDocument();
    expect(screen.getByText('日常')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('navigates to the gallery detail route with the numeric id as a string param', () => {
    const spy = vi
      .spyOn(Route, 'useLoaderData')
      .mockReturnValue({ pagination: GALLERY_LIST });
    const GalleryPage = Route.options.component;
    if (!GalleryPage) throw new Error('gallery route has no component');

    const { container } = render(<GalleryPage />);
    const cards = container.querySelectorAll('[data-slot="card"]');
    expect(cards.length).toBe(2);

    cards[1]?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    expect(useNavigateMock).toHaveBeenCalledWith({
      to: '/gallery/$id',
      params: { id: '4' },
    });
    spy.mockRestore();
  });
});
