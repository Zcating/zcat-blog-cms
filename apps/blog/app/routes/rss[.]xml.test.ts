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

import { Route } from './rss[.]xml';

const SITE = 'https://blog.rss.test';

const ARTICLES = [
  {
    id: 7,
    title: '第一篇 & <草稿>',
    excerpt: '摘要 "quoted"',
    content: '# 正文',
    createdAt: '2026-05-19T12:00:00.000Z',
    updatedAt: '2026-05-19T12:00:00.000Z',
    publishAt: '2026-05-19T12:00:00.000Z',
    articleAndArticleTags: [],
  },
];

type RssGetHandler = () => Promise<Response>;

function getFeedHandler(): RssGetHandler | null {
  const handlers: unknown = Route.options.server?.handlers;
  if (typeof handlers !== 'object' || handlers === null) return null;
  const get = (handlers as { GET?: unknown }).GET;
  return typeof get === 'function' ? (get as RssGetHandler) : null;
}

const getHandler = getFeedHandler();

describe('server route: /rss.xml', () => {
  beforeEach(() => {
    getArticleListMock.mockReset();
    getArticleListMock.mockResolvedValue({
      data: ARTICLES,
      total: 1,
      totalPages: 1,
      page: 1,
      pageSize: 20,
    });
    vi.stubEnv('BLOG_SITE_URL', SITE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers a GET handler on the route', () => {
    expect(getHandler).toBeTypeOf('function');
  });

  it('answers with an RSS 2.0 document', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'application/rss+xml; charset=utf-8',
    );
    expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(
      true,
    );
    expect(body).toContain('<rss version="2.0">');
    expect(body).toContain('<channel>');
    expect(body).toContain('<title>ZCAT Blog</title>');
    expect(body).toContain('<link>https://blog.rss.test</link>');
    expect(body).toContain('<language>zh-CN</language>');
    expect(body.trimEnd().endsWith('</rss>')).toBe(true);
  });

  it('emits one escaped item per article, linked at its absolute post URL', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const body = await (await getHandler()).text();

    expect(body).toContain('<title>第一篇 &amp; &lt;草稿&gt;</title>');
    expect(body).toContain('<link>https://blog.rss.test/post-board/7</link>');
    expect(body).toContain('<guid>https://blog.rss.test/post-board/7</guid>');
    expect(body).toContain('<pubDate>Tue, 19 May 2026 12:00:00 GMT</pubDate>');
    expect(body).toContain(
      '<description>摘要 &quot;quoted&quot;</description>',
    );
    expect(body.match(/<item>/g)).toHaveLength(1);
  });

  it('requests the latest twenty articles', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    await getHandler();

    expect(getArticleListMock).toHaveBeenCalledTimes(1);
    expect(getArticleListMock.mock.calls[0]?.[0]).toEqual({
      data: { page: 1, pageSize: 20, order: 'latest' },
    });
  });

  it('reads the site origin from BLOG_SITE_URL on every request, with no hardcoded domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', 'https://second.rss.test/');
    const second = await (await getHandler()).text();

    expect(second).toContain('<link>https://second.rss.test</link>');
    expect(second).toContain(
      '<link>https://second.rss.test/post-board/7</link>',
    );
    expect(second).not.toContain(SITE);
  });

  it('fails loudly when BLOG_SITE_URL is absent, instead of emitting links under a placeholder domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', '');

    await expect(getHandler()).rejects.toThrow(BlogSiteUrlMissingError);
    expect(getArticleListMock).not.toHaveBeenCalled();
  });

  it('declares charset=utf-8, so an ISO-8859-1 defaulting client does not mojibake the Chinese', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const contentType = response.headers.get('Content-Type') ?? '';
    const bytes = new Uint8Array(await response.arrayBuffer());

    expect(contentType).toMatch(/^application\/rss\+xml\s*;/);
    expect(contentType).toMatch(/charset\s*=\s*utf-8/i);

    const utf8 = new TextDecoder('utf-8').decode(bytes);
    expect(utf8).toContain('<title>第一篇 &amp; &lt;草稿&gt;</title>');
    expect(utf8).toContain('<description>个人技术博客</description>');

    const latin1 = new TextDecoder('iso-8859-1').decode(bytes);
    expect(latin1).not.toContain('个人技术博客');
    expect(latin1).not.toBe(utf8);
  });
});
