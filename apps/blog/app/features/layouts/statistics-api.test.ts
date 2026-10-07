import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { loadWasm, md5 } = vi.hoisted(() => ({
  loadWasm: vi.fn(async () => undefined),
  md5: vi.fn((_value: string) => 'signed-digest'),
}));

vi.mock('@fingerprintjs/fingerprintjs', () => ({
  default: {
    load: async () => ({ get: async () => ({ visitorId: 'device-abc' }) }),
  },
}));

vi.mock('@originjs/crypto-js-wasm', () => ({
  default: { MD5: Object.assign(md5, { loadWasm }) },
}));

import { StatisticsApi } from './statistics-api';

interface CapturedRequest {
  url: string;
  init: RequestInit;
}

let captured: CapturedRequest[] = [];
let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  captured = [];
  originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.push({ url: String(input), init: init ?? {} });
    return {
      ok: true,
      status: 200,
      json: async () => ({ code: '0000', message: 'success', data: null }),
    } as Response;
  }) as typeof globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('uploadVisitRecord', () => {
  it('posts the visit record to the blog same-origin /api mount', async () => {
    await StatisticsApi.uploadVisitRecord('/post-board', '文章列表');

    expect(captured).toHaveLength(1);
    expect(new URL(captured[0].url, 'http://blog.invalid').pathname).toBe(
      '/api/blog/visitor',
    );
  });

  it('signs the record with a Data-Hash header so the backend can verify it', async () => {
    await StatisticsApi.uploadVisitRecord('/post-board', '文章列表');

    const headers = captured[0].init.headers as Record<string, string>;

    expect(headers['Data-Hash']).toBe('signed-digest');
    expect(md5).toHaveBeenCalled();
  });

  it('signs the same fields it sends, so the backend can rebuild the digest', async () => {
    await StatisticsApi.uploadVisitRecord('/post-board', '文章列表');

    const body = JSON.parse(String(captured[0].init.body)) as Record<
      string,
      string
    >;
    const signed = md5.mock.calls[0]?.[0] as string;
    const signedKeys = signed.split('&').map((pair) => pair.split('=')[0]);

    expect(signedKeys.slice().sort()).toEqual(Object.keys(body).sort());
  });

  it('signs fields in a stable order, since the backend hashes them the same way', async () => {
    await StatisticsApi.uploadVisitRecord('/post-board', '文章列表');

    const signed = md5.mock.calls[0]?.[0] as string;
    const signedKeys = signed.split('&').map((pair) => pair.split('=')[0]);

    expect(signedKeys).toEqual(signedKeys.slice().sort());
  });

  it('reports the page and the browser it was read from', async () => {
    await StatisticsApi.uploadVisitRecord('/post-board', '文章列表');

    const body = JSON.parse(String(captured[0].init.body));

    expect(body).toMatchObject({
      pagePath: '/post-board',
      pageTitle: '文章列表',
      deviceId: 'device-abc',
    });
    expect(body.browser).toBeTruthy();
    expect(body.device).toBeTruthy();
  });

  it('swallows a rejected post so page rendering is never blocked', async () => {
    globalThis.fetch = (async () => {
      throw new Error('network down');
    }) as typeof globalThis.fetch;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await expect(
      StatisticsApi.uploadVisitRecord('/post-board', '文章列表'),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
