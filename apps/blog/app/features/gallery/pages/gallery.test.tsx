import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useNavigateMock, useLoaderDataMock } = vi.hoisted(() => ({
  useNavigateMock: vi.fn(),
  useLoaderDataMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router',
  );
  return {
    ...actual,
    useNavigate: () => useNavigateMock,
    getRouteApi: () => ({ useLoaderData: useLoaderDataMock }),
  };
});

// --- import after mocks ---

import { GalleryPage } from './gallery';

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

function makeLargeGalleryPayload(count: number) {
  return {
    data: Array.from({ length: count }, (_, index) => ({
      id: index + 1,
      name: `相册${index + 1}`,
      description: `描述${index + 1}`,
      cover: null,
    })),
    total: 11,
    totalPages: 2,
    page: 1,
    pageSize: 8,
  };
}

describe('route component: /_blog/gallery', () => {
  beforeEach(() => {
    useLoaderDataMock.mockReset();
    useNavigateMock.mockReset();
  });

  it('renders one card per gallery, using the gallery id from the payload', () => {
    useLoaderDataMock.mockReturnValue({ pagination: GALLERY_LIST, page: 1 });

    render(<GalleryPage />);

    expect(screen.getByText('一些我拍的照片')).toBeInTheDocument();
    expect(screen.getByText('旅行')).toBeInTheDocument();
    expect(screen.getByText('日常')).toBeInTheDocument();
  });

  it('navigates to the gallery detail route with the numeric id as a string param', () => {
    useLoaderDataMock.mockReturnValue({ pagination: GALLERY_LIST, page: 1 });

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
  });

  it('renders the pagination control only when there is more than one page, with a fixture larger than a single page', () => {
    const payload = makeLargeGalleryPayload(8);
    useLoaderDataMock.mockReturnValue({ pagination: payload, page: 1 });

    render(<GalleryPage />);

    expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to previous page')).toBeInTheDocument();
  });

  it('does not render the pagination control when the album list fits on a single page', () => {
    const singlePage = {
      data: [
        {
          id: 1,
          name: '火壶表演',
          description: '唯一的相册',
          cover: null,
        },
      ],
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 8,
    };
    useLoaderDataMock.mockReturnValue({ pagination: singlePage, page: 1 });

    render(<GalleryPage />);

    expect(screen.queryByLabelText('Go to next page')).toBeNull();
    expect(screen.queryByLabelText('Go to previous page')).toBeNull();
  });

  it('does not render the pagination control when no albums are available', () => {
    const empty = {
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 8,
    };
    useLoaderDataMock.mockReturnValue({ pagination: empty, page: 1 });

    render(<GalleryPage />);

    expect(screen.queryByLabelText('Go to next page')).toBeNull();
    expect(screen.queryByLabelText('Go to previous page')).toBeNull();
  });

  it('navigates with the page search param wired through the same route', () => {
    const payload = makeLargeGalleryPayload(8);
    useLoaderDataMock.mockReturnValue({ pagination: payload, page: 1 });

    render(<GalleryPage />);

    expect(useNavigateMock).not.toHaveBeenCalled();

    const next = screen.getByLabelText('Go to next page');
    const link = next.closest('a');
    expect(link).not.toBeNull();

    link?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );

    expect(useNavigateMock).toHaveBeenCalledWith({
      to: '/gallery',
      search: { page: '2' },
    });
  });
});
