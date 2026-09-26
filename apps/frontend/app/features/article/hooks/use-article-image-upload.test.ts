/**
 * Tests for the article OSS image upload helper.
 *
 * Scope:
 *   1. Markdown blob: URLs are extracted from the markdown payload.
 *   2. Each blob is fetched, compressed via `Compressor`, then PUT to
 *      the presigned URL exposed by `getSystemSettingUploadUrlServerFn`.
 *   3. After upload, the keys are POSTed to `uploadArticleImages` and
 *      returned (the editor rewrites the markdown with these keys).
 *
 * The only mocked boundaries are `fetch` (for both `fetch(blob:)` and
 * `fetch(presignedUrl)`) plus the two server functions.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUploadImages = vi.fn();
const mockGetUploadUrl = vi.fn();

vi.mock('@cms/server/articles', () => ({
  uploadArticleImages: (...args: unknown[]) => mockUploadImages(...args),
}));

vi.mock('@cms/server/system-setting', () => ({
  getSystemSettingUploadUrlServerFn: (...args: unknown[]) =>
    mockGetUploadUrl(...args),
}));

import {
  rewriteArticleMarkdownImages,
  uploadArticleMarkdownImages,
} from './use-article-image-upload';

const originalFetch = global.fetch;

beforeEach(() => {
  mockUploadImages.mockReset();
  mockGetUploadUrl.mockReset();
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.clearAllMocks();
});

describe('uploadArticleMarkdownImages', () => {
  it('extracts blob URLs, fetches each, uploads via presigned URL, and returns the resolved keys', async () => {
    // blob fetch returns a fake image blob
    const fakeBlob = new Blob(['fake-image'], { type: 'image/png' });
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.startsWith('blob:')) {
        return new Response(fakeBlob, { status: 200 });
      }
      if (url.startsWith('http://oss.local/upload')) {
        return new Response(null, { status: 200 });
      }
      throw new Error(`Unexpected fetch: ${url}`);
    }) as unknown as typeof fetch;

    // Capture the key the implementation generates; the presigned
    // URL mirrors that key so the test can assert the upload chain.
    mockGetUploadUrl.mockImplementation(
      async ({ data }: { data: { key: string } }) => ({
        presignedUrl: `http://oss.local/upload/${encodeURIComponent(data.key)}?signed=1`,
      }),
    );

    mockUploadImages.mockImplementation(
      async ({ data }: { data: { images: string[] } }) => data.images,
    );

    const keys = await uploadArticleMarkdownImages([
      'blob:http://localhost/abc',
      'blob:http://localhost/def',
    ]);

    expect(keys.length).toBe(2);
    keys.forEach((key) => {
      expect(key.startsWith('articles/')).toBe(true);
    });
    expect(mockGetUploadUrl).toHaveBeenCalledTimes(2);
    expect(mockUploadImages).toHaveBeenCalledTimes(1);
  });
});

describe('rewriteArticleMarkdownImages', () => {
  it('rewrites each blob URL in the markdown payload to its resolved key', () => {
    const markdown =
      'Intro\n\n![alt one](blob:http://localhost/abc)\n\nMiddle\n\n![alt two](blob:http://localhost/def)\n';

    const result = rewriteArticleMarkdownImages(markdown, [
      'articles/a.png',
      'articles/b.png',
    ]);

    expect(result).toBe(
      'Intro\n\n![alt one](articles/a.png)\n\nMiddle\n\n![alt two](articles/b.png)\n',
    );
  });

  it('preserves blob URLs that are not present in the resolved list', () => {
    const markdown = '![alt](blob:http://localhost/abc)';

    const result = rewriteArticleMarkdownImages(markdown, []);

    expect(result).toBe('![alt](blob:http://localhost/abc)');
  });
});
