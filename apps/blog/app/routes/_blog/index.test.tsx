import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getArticleListMock, getUserInfoMock } = vi.hoisted(() => ({
  getArticleListMock: vi.fn(),
  getUserInfoMock: vi.fn(),
}));

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

// --- import after mocks ---

import { loader } from './index';

const USER_INFO = {
  name: 'Zcat',
  occupation: '前端工程师',
  abstract: 'abstract',
  aboutMe: 'about me',
  avatar: 'https://example.com/avatar.png',
  contact: { email: 'a@example.com', github: 'https://github.com/zcat' },
};

const ARTICLE_LIST = {
  data: [
    {
      id: 1,
      title: '第一篇文章',
      excerpt: '这里是摘要',
      content: '# 正文',
      createByUserId: null,
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      publishAt: '2026-05-19T12:00:00.000Z',
      articleAndArticleTags: [],
    },
  ],
  total: 23,
  totalPages: 3,
  page: 2,
  pageSize: 10,
};

describe('route loader: /_blog/', () => {
  beforeEach(() => {
    getArticleListMock.mockReset();
    getUserInfoMock.mockReset();
    getUserInfoMock.mockResolvedValue(USER_INFO);
    getArticleListMock.mockResolvedValue(ARTICLE_LIST);
  });

  it('resolves the article page and the user profile from the backend payloads', async () => {
    const result = await loader({ search: { page: '2', order: 'latest' } });

    expect(result.pagination).toEqual(ARTICLE_LIST);
    expect(result.pagination.data[0]?.id).toBe(1);
    expect(result.userInfo).toEqual(USER_INFO);
    expect(result.userInfo).not.toHaveProperty('createdAt');
    expect(result.userInfo).not.toHaveProperty('updatedAt');
    expect(result.page).toBe(2);
    expect(result.order).toBe('latest');
  });

  it('passes page, pageSize and order through to the article list server function', async () => {
    await loader({ search: { page: '3', order: 'oldest' } });

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 3, pageSize: 10, order: 'oldest' },
    });
  });

  it('falls back to the first page and the latest order when the search params are absent', async () => {
    const result = await loader({ search: {} });

    expect(result.page).toBe(1);
    expect(result.order).toBe('latest');
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });

  it('falls back to the first page when the page search param is not a positive number', async () => {
    const result = await loader({ search: { page: 'not-a-page' } });

    expect(result.page).toBe(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });
});
