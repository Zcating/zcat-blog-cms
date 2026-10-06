import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleListMock, getUserInfoMock, getPhotoListMock } = vi.hoisted(
  () => ({
    getArticleListMock: vi.fn(),
    getUserInfoMock: vi.fn(),
    getPhotoListMock: vi.fn(),
  }),
);

vi.mock('@blog/server/article', async () => {
  const actual = await vi.importActual<typeof import('@blog/server/article')>(
    '@blog/server/article',
  );
  return {
    ...actual,
    getArticleList: (...args: unknown[]) => getArticleListMock(...args),
  };
});

vi.mock('@blog/server/user', async () => {
  const actual =
    await vi.importActual<typeof import('@blog/server/user')>(
      '@blog/server/user',
    );
  return {
    ...actual,
    getUserInfo: (...args: unknown[]) => getUserInfoMock(...args),
  };
});

vi.mock('@blog/server/photo', async () => {
  const actual =
    await vi.importActual<typeof import('@blog/server/photo')>(
      '@blog/server/photo',
    );
  return {
    ...actual,
    getPhotoList: (...args: unknown[]) => getPhotoListMock(...args),
  };
});

// --- import after mocks ---

import { defaultParseSearch } from '@tanstack/react-router';

import { Route, loader } from './index';

interface HomeSearch {
  page?: number;
  order?: 'latest' | 'oldest';
}

function parseRealUrl(search: string): Record<string, string | number> {
  return defaultParseSearch(search) as Record<string, string | number>;
}

function validateSearch(search: Record<string, unknown>): HomeSearch {
  const schema = Route.options.validateSearch;
  if (schema === undefined || !('parse' in schema)) {
    throw new Error('/_blog/ must declare an object validateSearch');
  }
  return schema.parse(search) as HomeSearch;
}

const USER_INFO = {
  name: 'Zcat',
  occupation: '前端工程师',
  abstract: 'abstract',
  aboutMe: 'about me',
  avatar: 'https://example.com/avatar.png',
  signedAvatar: 'https://bucket.example.com/avatar.png?sig=1',
  contact: { email: 'a@example.com', github: 'https://github.com/zcat' },
};

function makeArticle(id: number) {
  return {
    id,
    title: `文章 ${id}`,
    excerpt: `摘要 ${id}`,
    content: '# 正文',
    createByUserId: null,
    createdAt: '2026-05-19T12:00:00.000Z',
    updatedAt: '2026-05-19T12:00:00.000Z',
    publishAt: '2026-05-19T12:00:00.000Z',
    articleAndArticleTags: [],
  };
}

function makePhoto(id: number) {
  return {
    id,
    name: `照片 ${id}`,
    url: `photos/${id}.jpg`,
    signedUrl: `https://bucket.example/${id}.jpg?sig=1`,
    signedThumbnailUrl: `https://bucket.example/${id}.thumbnail.jpg?sig=1`,
    thumbnailUrl: `https://cdn.example.com/${id}_t.jpg`,
    createdAt: '2026-05-20T00:00:00.000Z',
    albumId: 2,
    albumName: '相册 2',
  };
}

const ARTICLE_LIST = {
  data: Array.from({ length: 5 }, (_, index) => makeArticle(index + 1)),
  total: 23,
  totalPages: 3,
  page: 1,
  pageSize: 10,
};

const PHOTO_LIST = {
  data: Array.from({ length: 12 }, (_, index) => makePhoto(index + 101)),
  total: 40,
  totalPages: 4,
  page: 1,
  pageSize: 10,
};

function setupDefaults() {
  getUserInfoMock.mockReset();
  getArticleListMock.mockReset();
  getPhotoListMock.mockReset();
  getUserInfoMock.mockResolvedValue(USER_INFO);
  getArticleListMock.mockResolvedValue(ARTICLE_LIST);
  getPhotoListMock.mockResolvedValue(PHOTO_LIST);
}

describe('route loader: /_blog/', () => {
  beforeEach(setupDefaults);

  it('resolves the user info the hero renders, the articles and the photo feed from the backend payloads', async () => {
    const result = await loader({ search: { order: 'latest' } });

    expect(result.userInfo).toEqual(USER_INFO);
    expect(result.userInfo).not.toHaveProperty('createdAt');
    expect(result.order).toBe('latest');
  });

  it('asks for exactly five articles and twelve photos, the two numbers the grid is built from', async () => {
    await loader({ search: { order: 'latest' } });

    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 5, order: 'latest' },
    });
    expect(getPhotoListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 12 },
    });
  });

  it('opens the grid with photos, not with articles', async () => {
    const result = await loader({ search: { order: 'latest' } });

    expect(result.items[0]?.kind).toBe('photo');
    expect(result.items[1]?.kind).toBe('photo');
  });

  it('carries every article and every photo into the grid exactly once', async () => {
    const result = await loader({ search: { order: 'latest' } });

    const articleIds = result.items
      .filter((item) => item.kind === 'article')
      .map((item) => item.article?.id);
    const photoIds = result.items
      .filter((item) => item.kind === 'photo')
      .map((item) => item.photo?.id);

    expect(articleIds).toEqual([1, 2, 3, 4, 5]);
    expect(photoIds).toEqual(PHOTO_LIST.data.map((photo) => photo.id));
    expect(result.items).toHaveLength(5 + 12);
  });

  it('scatters the articles through the photo run instead of trailing them at the end', async () => {
    const result = await loader({ search: { order: 'latest' } });
    const kinds = result.items.map((item) => item.kind);

    expect(kinds.lastIndexOf('article')).toBeLessThan(kinds.length - 1);
    expect(kinds.filter((kind) => kind === 'article').length).toBe(5);
  });

  it('gives every photo card the album it can navigate to', async () => {
    const result = await loader({ search: { order: 'latest' } });

    const photos = result.items.filter((item) => item.kind === 'photo');
    expect(photos).toHaveLength(12);
    for (const item of photos) {
      expect(item.photo?.albumId).toBe(2);
      expect(item.photo?.albumName).toBe('相册 2');
    }
  });

  it('drops the articles out of the grid when the backend has none', async () => {
    getArticleListMock.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 10,
    });

    const result = await loader({ search: { order: 'latest' } });

    expect(result.items.filter((item) => item.kind === 'article')).toEqual([]);
    expect(result.items.filter((item) => item.kind === 'photo')).toHaveLength(
      12,
    );
  });

  it('drops the photos out of the grid when the backend has none', async () => {
    getPhotoListMock.mockResolvedValue({
      data: [],
      total: 0,
      totalPages: 0,
      page: 1,
      pageSize: 10,
    });

    const result = await loader({ search: { order: 'latest' } });

    expect(result.items.filter((item) => item.kind === 'photo')).toEqual([]);
    expect(result.items.filter((item) => item.kind === 'article')).toHaveLength(
      5,
    );
  });
});

describe('route search validation: /_blog/', () => {
  beforeEach(setupDefaults);

  it('keeps the order param strict', () => {
    expect(() => validateSearch({ order: 'newest' })).toThrow(/Invalid option/);
  });

  it('honours the order the reader picked', async () => {
    const result = await loader({ search: { order: 'oldest' } });

    expect(result.order).toBe('oldest');
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 5, order: 'oldest' },
    });
  });

  it('falls back to the latest order when the search params are absent', async () => {
    const result = await loader({ search: {} });

    expect(result.order).toBe('latest');
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 5, order: 'latest' },
    });
  });

  it('ignores a leftover page param rather than paginating the homepage', async () => {
    const search = parseRealUrl('?page=3&order=oldest');

    const result = await loader({
      search: { page: Number(search.page), order: 'oldest' },
    });

    expect(result.order).toBe('oldest');
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 5, order: 'oldest' },
    });
  });
});
