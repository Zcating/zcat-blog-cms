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

import { Route } from './sitemap[.]xml';

const ARTICLES = [
  {
    id: 7,
    title: '第一篇',
    excerpt: '摘要',
    content: '# 正文',
    createdAt: '2026-05-19T12:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    publishAt: '2026-05-21T12:00:00.000Z',
    articleAndArticleTags: [],
  },
];

type SitemapGetHandler = () => Promise<Response>;

function getFeedHandler(): SitemapGetHandler | null {
  const handlers: unknown = Route.options.server?.handlers;
  if (typeof handlers !== 'object' || handlers === null) return null;
  const get = (handlers as { GET?: unknown }).GET;
  return typeof get === 'function' ? (get as SitemapGetHandler) : null;
}

const getHandler = getFeedHandler();

describe('server route: /sitemap.xml', () => {
  beforeEach(() => {
    getArticleListMock.mockReset();
    getArticleListMock.mockResolvedValue({
      data: ARTICLES,
      totalPages: 1,
      page: 1,
      pageSize: 1000,
    });
  });

  it('registers a GET handler on the route', () => {
    expect(getHandler).toBeTypeOf('function');
  });

  it('answers with a sitemaps.org urlset', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/xml');
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
      true,
    );
    expect(body).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    );
    expect(body.trimEnd().endsWith('</urlset>')).toBe(true);
  });

  it('lists the four static pages and one entry per article', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const body = await (await getHandler()).text();

    expect(body.match(/<url>/g)).toHaveLength(5);
    for (const staticPath of ['', 'post-board', 'about', 'gallery']) {
      expect(body).toContain(
        `<url><loc>https://blog.zcat.example/${staticPath}</loc>`,
      );
    }
    expect(body).toContain(
      '<url><loc>https://blog.zcat.example/post-board/7</loc>' +
        '<lastmod>2026-05-20T12:00:00.000Z</lastmod></url>',
    );
  });

  it('requests the latest thousand articles', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    await getHandler();

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 1000, order: 'latest' },
    });
  });
});
