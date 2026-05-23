import { describe, expect, it, vi } from 'vitest';

import { HttpClient } from './http-client';

const ORIGINAL_ENV = import.meta.env;

describe('HttpClient', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta.env', {
      ...ORIGINAL_ENV,
      VITE_API_URL: 'http://api.test',
      VITE_SERVER_URL: 'http://server.test',
    });
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('get', () => {
    it('returns data on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '0000', data: { id: 1 } })),
      );

      const result = await HttpClient.get('blog/article/1');
      expect(result).toEqual({ id: 1 });
    });

    it('throws on non-zero code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'ERR0005', message: 'not found' }),
        ),
      );

      await expect(HttpClient.get('blog/article/999')).rejects.toThrow(
        'not found',
      );
    });

    it('appends query params to URL', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '0000', data: [] })),
      );

      await HttpClient.get('blog/article/list', { page: '1', pageSize: '10' });
      const calledUrl = vi.mocked(fetch).mock.calls[0][0];
      expect(calledUrl).toContain('page=1');
      expect(calledUrl).toContain('pageSize=10');
    });
  });

  describe('serverSideGet', () => {
    it('returns data on success', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '0000', data: { name: 'test' } })),
      );

      const result = await HttpClient.serverSideGet('blog/user-info');
      expect(result).toEqual({ name: 'test' });
    });

    it('throws on non-zero code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(
          JSON.stringify({ code: 'ERR0002', message: 'unauthorized' }),
        ),
      );

      await expect(
        HttpClient.serverSideGet('blog/user-info'),
      ).rejects.toThrow('unauthorized');
    });
  });

  describe('post', () => {
    it('sends JSON body and returns data', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '0000', data: { id: 'new' } })),
      );

      const result = await HttpClient.post('blog/visitor', { pagePath: '/' });
      expect(result).toEqual({ id: 'new' });

      const [url, options] = vi.mocked(fetch).mock.calls[0] as any;
      expect(url).toContain('blog/visitor');
      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(options.body)).toEqual({ pagePath: '/' });
    });

    it('merges custom headers', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        new Response(JSON.stringify({ code: '0000' })),
      );

      await HttpClient.post('blog/visitor', {}, { 'Data-Hash': 'abc' });
      const [, options] = vi.mocked(fetch).mock.calls[0] as any;
      expect(options.headers['Data-Hash']).toBe('abc');
    });
  });
});
