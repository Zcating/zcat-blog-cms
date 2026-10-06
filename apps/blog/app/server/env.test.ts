import { afterEach, describe, expect, it } from 'vitest';

import {
  BackendUrlMissingError,
  BlogSiteUrlMissingError,
  resolveBackendApiUrl,
  resolveBlogSiteUrl,
} from './env';

const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;
const ORIGINAL_SITE_URL = process.env.BLOG_SITE_URL;

afterEach(() => {
  if (ORIGINAL_BACKEND_URL === undefined) {
    delete process.env.BACKEND_API_URL;
  } else {
    process.env.BACKEND_API_URL = ORIGINAL_BACKEND_URL;
  }
  if (ORIGINAL_SITE_URL === undefined) {
    delete process.env.BLOG_SITE_URL;
  } else {
    process.env.BLOG_SITE_URL = ORIGINAL_SITE_URL;
  }
});

describe('resolveBackendApiUrl', () => {
  it('returns the configured base URL', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('throws BackendUrlMissingError when the variable is absent', () => {
    delete process.env.BACKEND_API_URL;
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('throws BackendUrlMissingError when the variable is an empty string', () => {
    process.env.BACKEND_API_URL = '';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('throws BackendUrlMissingError when the variable is whitespace only', () => {
    process.env.BACKEND_API_URL = '   \t\n  ';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('strips a single trailing slash', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api/';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('strips repeated trailing slashes', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api///';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('trims surrounding whitespace before stripping the slash', () => {
    process.env.BACKEND_API_URL = '  http://backend.local/api/  ';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('keeps a bare host without a path intact', () => {
    process.env.BACKEND_API_URL = 'http://backend.local:9090';
    expect(resolveBackendApiUrl()).toBe('http://backend.local:9090');
  });

  it('reads fresh on every call with no module-level caching', () => {
    process.env.BACKEND_API_URL = 'http://first.local/api';
    expect(resolveBackendApiUrl()).toBe('http://first.local/api');

    process.env.BACKEND_API_URL = 'http://second.local/api';
    expect(resolveBackendApiUrl()).toBe('http://second.local/api');

    delete process.env.BACKEND_API_URL;
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('exposes a stable error code and name', () => {
    delete process.env.BACKEND_API_URL;

    let caught: unknown;
    try {
      resolveBackendApiUrl();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BackendUrlMissingError);
    expect(caught).toMatchObject({
      code: 'BackendUrlMissingError',
      name: 'BackendUrlMissingError',
    });
  });
});

describe('resolveBlogSiteUrl', () => {
  it('returns the configured site origin', () => {
    process.env.BLOG_SITE_URL = 'https://blog.local';
    expect(resolveBlogSiteUrl()).toBe('https://blog.local');
  });

  it('throws BlogSiteUrlMissingError when the variable is absent', () => {
    delete process.env.BLOG_SITE_URL;
    expect(() => resolveBlogSiteUrl()).toThrow(BlogSiteUrlMissingError);
  });

  it('throws BlogSiteUrlMissingError when the variable is whitespace only', () => {
    process.env.BLOG_SITE_URL = '   ';
    expect(() => resolveBlogSiteUrl()).toThrow(BlogSiteUrlMissingError);
  });

  it('strips trailing slashes so feed links never emit a doubled separator', () => {
    process.env.BLOG_SITE_URL = 'https://blog.local///';
    expect(resolveBlogSiteUrl()).toBe('https://blog.local');
  });

  it('trims surrounding whitespace before stripping the slash', () => {
    process.env.BLOG_SITE_URL = '  https://blog.local/  ';
    expect(resolveBlogSiteUrl()).toBe('https://blog.local');
  });

  it('reads fresh on every call with no module-level caching', () => {
    process.env.BLOG_SITE_URL = 'https://first.local';
    expect(resolveBlogSiteUrl()).toBe('https://first.local');

    process.env.BLOG_SITE_URL = 'https://second.local';
    expect(resolveBlogSiteUrl()).toBe('https://second.local');
  });

  it('exposes a stable error code and name', () => {
    delete process.env.BLOG_SITE_URL;

    let caught: unknown;
    try {
      resolveBlogSiteUrl();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BlogSiteUrlMissingError);
    expect(caught).toMatchObject({
      code: 'BlogSiteUrlMissingError',
      name: 'BlogSiteUrlMissingError',
    });
  });
});
