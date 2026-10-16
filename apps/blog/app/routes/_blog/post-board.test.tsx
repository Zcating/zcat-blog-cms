import { isRedirect } from '@tanstack/react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { pageParamSchema } from '@blog/common';

const { getArticleListMock } = vi.hoisted(() => ({
  getArticleListMock: vi.fn(),
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

// --- import after mocks ---

import { Route, loader } from './post-board';

const ARTICLE_LIST = {
  data: [
    {
      id: 7,
      title: '第七篇',
      excerpt: '摘要',
      content: '# 正文',
      createByUserId: null,
      createdAt: '2026-05-19T12:00:00.000Z',
      updatedAt: '2026-05-19T12:00:00.000Z',
      publishAt: '2026-05-19T12:00:00.000Z',
      articleAndArticleTags: [],
    },
  ],
  total: 37,
  totalPages: 4,
  page: 2,
  pageSize: 10,
};

describe('route loader: /_blog/post-board', () => {
  beforeEach(() => {
    getArticleListMock.mockReset();
    getArticleListMock.mockResolvedValue(ARTICLE_LIST);
  });

  it('resolves the paginated article list, which carries both total and totalPages', async () => {
    const result = await loader({ search: { page: '2' } });

    expect(result.pagination).toEqual(ARTICLE_LIST);
    expect(result.pagination.totalPages).toBe(4);
    expect(result.pagination.total).toBe(37);
    expect(result.pagination.total).not.toBe(result.pagination.data.length);
    expect(result.page).toBe(2);
  });

  it('requests the latest ten articles for the requested page', async () => {
    await loader({ search: { page: '3' } });

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 3, pageSize: 10, order: 'latest' },
    });
  });

  it('redirects an out-of-range request to the last available page', async () => {
    getArticleListMock.mockResolvedValue({
      ...ARTICLE_LIST,
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

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 9, pageSize: 10, order: 'latest' },
    });
    expect(isRedirect(error)).toBe(true);

    if (!isRedirect(error)) {
      return;
    }
    expect(error.options.to).toBe('/post-board');
    expect(error.options.search).toEqual({ page: '4' });
    expect(error.options.replace).toBe(true);
  });
});

describe('route search validation: /_blog/post-board', () => {
  it('wires the shared page param schema as validateSearch', () => {
    expect(Route.options.validateSearch).toBe(pageParamSchema);
  });
});
