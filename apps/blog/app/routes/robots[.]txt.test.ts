import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BlogSiteUrlMissingError } from '@blog/server/env';

import { Route } from './robots[.]txt';

const SITE = 'https://blog.robots.test';

type RobotsGetHandler = () => Promise<Response>;

function getFeedHandler(): RobotsGetHandler | null {
  const handlers: unknown = Route.options.server?.handlers;
  if (typeof handlers !== 'object' || handlers === null) return null;
  const get = (handlers as { GET?: unknown }).GET;
  return typeof get === 'function' ? (get as RobotsGetHandler) : null;
}

const getHandler = getFeedHandler();

describe('server route: /robots.txt', () => {
  beforeEach(() => {
    vi.stubEnv('BLOG_SITE_URL', SITE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers a GET handler on the route', () => {
    expect(getHandler).toBeTypeOf('function');
  });

  it('answers as plain text', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/plain; charset=utf-8',
    );
  });

  it('preserves the crawling directives of the static file it replaces', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const body = await (await getHandler()).text();

    expect(body).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://blog.robots.test/sitemap.xml\n',
    );
    expect(body.split('\n')[0]).toBe('User-agent: *');
    expect(body).toContain('Allow: /');
    expect(body).toContain('Sitemap: https://blog.robots.test/sitemap.xml');
  });

  it('reads the site origin from BLOG_SITE_URL on every request, with no hardcoded domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', 'https://second.robots.test/');
    const second = await (await getHandler()).text();

    expect(second).toContain('Sitemap: https://second.robots.test/sitemap.xml');
    expect(second).not.toContain(SITE);
    expect(second).not.toContain('blog.zcat.example');
  });

  it('fails loudly when BLOG_SITE_URL is absent, instead of advertising a placeholder domain', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    vi.stubEnv('BLOG_SITE_URL', '');

    await expect(getHandler()).rejects.toThrow(BlogSiteUrlMissingError);
  });

  it('declares charset=utf-8, so a client cannot misread the directives', async () => {
    if (!getHandler) throw new Error('route has no GET handler');

    const response = await getHandler();
    const contentType = response.headers.get('Content-Type') ?? '';

    expect(contentType).toMatch(/^text\/plain\s*;/);
    expect(contentType).toMatch(/charset\s*=\s*utf-8/i);
  });
});
