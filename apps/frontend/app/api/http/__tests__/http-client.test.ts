import Cookies from 'js-cookie';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('HttpClient', () => {
  let HttpClient: typeof import('../http-client').HttpClient;
  let csrf: typeof import('../http-client').csrf;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    Cookies.set('token', 'Bearer test-token');

    const module = await import('../http-client');
    HttpClient = module.HttpClient;
    csrf = module.csrf;
  });

  afterEach(() => {
    Cookies.remove('token');
    csrf.clear();
  });

  describe('get', () => {
    it('应该发送 GET 请求并返回数据', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: mockData }),
      });

      const result = await HttpClient.get<typeof mockData>('test/path');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path'),
        expect.objectContaining({ method: 'GET' }),
      );
      expect(result).toEqual(mockData);
    });

    it('应该正确构建查询参数', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.get('test/path', { page: 1, name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path?'),
        expect.any(Object),
      );
    });

    it('应该包含 Authorization header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.get('test/path');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        }),
      );
    });

    it('应该支持 AbortSignal', async () => {
      const abortController = HttpClient.createAbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.get('test/path', {}, { signal: abortController.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          signal: abortController.signal,
        }),
      );
    });

    it('应该在 401 时触发 UNAUTH 事件', async () => {
      const { EventCenter } = await import('../event-center');
      const emitSpy = vi.spyOn(EventCenter, 'emitEvent');
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      try {
        await HttpClient.get('test/path');
      } catch {
        // 忽略错误
      }

      expect(emitSpy).toHaveBeenCalledWith('UNAUTH', expect.any(Error));
    });

    it('应该在响应码非 0000 时抛出错误', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            code: '1001',
            message: 'Error message',
            data: null,
          }),
      });

      await expect(HttpClient.get('test/path')).rejects.toThrow(
        'Error message',
      );
    });
  });

  describe('post', () => {
    it('应该发送 POST 请求并返回数据', async () => {
      const mockData = { id: 1, name: 'Created' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: mockData }),
      });

      const result = await HttpClient.post<typeof mockData>('test/path', {
        name: 'test',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path'),
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual(mockData);
    });

    it('应该设置 Content-Type 为 application/json', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.post('test/path', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('应该包含 CSRF token 如果已设置', async () => {
      csrf.set('csrf-token-123');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.post('test/path', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-CSRF-Token': 'csrf-token-123',
          }),
        }),
      );
    });
  });

  describe('del', () => {
    it('应该发送 DELETE 请求', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.del('test/path/123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path/123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('重试机制', () => {
    it('应该在 500 错误时重试', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: '0000',
              message: 'success',
              data: 'result',
            }),
        });

      const result = await HttpClient.get('test/path');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });

    it('应该在 429 错误时重试', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              code: '0000',
              message: 'success',
              data: 'result',
            }),
        });

      const result = await HttpClient.get('test/path');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toBe('result');
    });
  });

  describe('CSRF', () => {
    it('get 应该返回当前的 CSRF token', () => {
      csrf.set('test-token');
      expect(csrf.get()).toBe('test-token');
    });

    it('clear 应该清除 CSRF token', () => {
      csrf.set('test-token');
      csrf.clear();
      expect(csrf.get()).toBeNull();
    });
  });
});
