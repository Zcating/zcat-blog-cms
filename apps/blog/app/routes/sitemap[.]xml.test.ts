import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

import { BlogSiteUrlMissingError } from '@blog/server/env';

import { Route } from './sitemap[.]xml';

const SITE = 'https://blog.sitemap.test';

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
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 1000,
    });
    vi.stubEnv('BLOG_SITE_URL', SITE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers a GET handler on the route', () => {
    expect(getHandler).toBeTypeOf('function');
  });

  it('answers with a sitemaps.org urlset', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/xml; charset=utf-8',
    );
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
        `<url><loc>https://blog.sitemap.test/${staticPath}</loc>`,
      );
    }
    expect(body).toContain(
      '<url><loc>https://blog.sitemap.test/post-board/7</loc>' +
        '<lastmod>2026-05-20T12:00:00.000Z</lastmod></url>',
    );
  });

  it('reads the site origin from BLOG_SITE_URL on every request, with no hardcoded domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', 'https://second.sitemap.test/');
    const second = await (await getHandler()).text();

    expect(second).toContain(
      '<url><loc>https://second.sitemap.test/gallery</loc>',
    );
    expect(second).not.toContain(SITE);
  });

  it('fails loudly when BLOG_SITE_URL is absent, instead of emitting locs under a placeholder domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', '');

    await expect(getHandler()).rejects.toThrow(BlogSiteUrlMissingError);
    expect(getArticleListMock).not.toHaveBeenCalled();
  });

  it('requests the latest thousand articles', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    await getHandler();

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 1000, order: 'latest' },
    });
  });

  it('declares charset=utf-8, even though every current URL is ASCII', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const contentType = response.headers.get('Content-Type') ?? '';
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(contentType).toMatch(/^application\/xml\s*;/);
    expect(contentType).toMatch(/charset\s*=\s*utf-8/i);

    const utf8 = new TextDecoder('utf-8').decode(bytes);
    expect(utf8).toContain('<loc>https://blog.sitemap.test/gallery</loc>');
    expect(bytes.every((byte) => byte < 0x80)).toBe(true);
  });
});
