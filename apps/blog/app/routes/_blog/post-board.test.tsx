import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { defaultParseSearch } from '@tanstack/react-router';

import { Route, loader } from './post-board';

interface PostBoardSearch {
  page?: number;
}

function parseRealUrl(search: string): Record<string, string | number> {
  return defaultParseSearch(search) as Record<string, string | number>;
}

function validateSearch(search: Record<string, unknown>): PostBoardSearch {
  const schema = Route.options.validateSearch;
  if (schema === undefined || !('parse' in schema)) {
    throw new Error('/_blog/post-board must declare an object validateSearch');
  }
  return schema.parse(search) as PostBoardSearch;
}

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
    await loader({ search: { page: '5' } });

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 5, pageSize: 10, order: 'latest' },
    });
  });

  it('falls back to the first page when the page search param is absent', async () => {
    const result = await loader({ search: {} });

    expect(result.page).toBe(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });

  it('falls back to the first page when the page search param is not a positive number', async () => {
    const search = parseRealUrl('?page=not-a-page');
    expect(typeof search.page).toBe('string');

    const result = await loader({ search: { page: search.page } });

    expect(result.page).toBe(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });

  it('falls back to the first page when the page search param is zero or negative', async () => {
    const zero = parseRealUrl('?page=0');
    expect(zero.page).toBe(0);
    const negative = parseRealUrl('?page=-3');
    expect(negative.page).toBe(-3);

    expect((await loader({ search: { page: zero.page } })).page).toBe(1);
    expect((await loader({ search: { page: negative.page } })).page).toBe(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });
});

describe('route search validation: /_blog/post-board', () => {
  beforeEach(() => {
    getArticleListMock.mockReset();
    getArticleListMock.mockResolvedValue({ ...ARTICLE_LIST, page: 2 });
  });

  it('serves page 2 for the numeric page TanStack Router parses out of a real ?page=2 URL', async () => {
    const search = parseRealUrl('?page=2');
    expect(typeof search.page).toBe('number');

    const validated = validateSearch(search);
    expect(validated.page).toBe(2);

    const result = await loader({ search: { page: validated.page } });

    expect(result.page).toBe(2);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 2, pageSize: 10, order: 'latest' },
    });
  });

  it('serves page 2 for the string page the pagination control itself navigates with', async () => {
    const navigated = String(2);
    expect(typeof navigated).toBe('string');

    const validated = validateSearch({ page: navigated });
    expect(validated.page).toBe(2);

    const result = await loader({ search: { page: validated.page } });

    expect(result.page).toBe(2);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 2, pageSize: 10, order: 'latest' },
    });
  });

  it('accepts a mistyped ?page= from a real URL and falls back to page 1 instead of throwing a search param error', async () => {
    const search = parseRealUrl('?page=not-a-page');
    expect(typeof search.page).toBe('string');

    expect(() => validateSearch(search)).not.toThrow();
    const validated = validateSearch(search);
    expect(validated.page).toBeUndefined();

    const result = await loader({ search: { page: validated.page } });

    expect(result.page).toBe(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
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
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 10, order: 'latest' },
    });
  });
});
