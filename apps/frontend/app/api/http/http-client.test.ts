import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

describe('HttpClient', () => {
  let HttpClient: typeof import('./http-client').HttpClient;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();

    const module = await import('./http-client');
    HttpClient = module.HttpClient;
  });

  describe('get', () => {
    it('should send GET request and return data', async () => {
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

    it('should build query params correctly', async () => {
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

    it('should support AbortSignal', async () => {
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

    it('should support object-style params as query string', async () => {
      const abortController = HttpClient.createAbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.get({
        path: 'test/path',
        params: { page: 1, name: 'test' },
        signal: abortController.signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path?'),
        expect.objectContaining({
          method: 'GET',
          signal: abortController.signal,
        }),
      );
      expect(mockFetch.mock.calls[0][0]).toContain('page=1');
      expect(mockFetch.mock.calls[0][0]).toContain('name=test');
    });

    it('should emit ERROR event on 401 business error', async () => {
      const { EventCenter } = await import('./event-center');
      const emitSpy = vi.spyOn(EventCenter, 'emitEvent');
      mockFetch.mockResolvedValueOnce({
        status: 401,
        json: () =>
          Promise.resolve({
            code: '1001',
            message: 'Unauthorized',
            data: null,
          }),
      });

      await expect(HttpClient.get('test/path')).rejects.toThrow('Unauthorized');

      expect(emitSpy).toHaveBeenCalledWith('ERROR', new Error('Unauthorized'));
    });

    it('should throw on non-0000 response code', async () => {
      const { EventCenter } = await import('./event-center');
      const emitSpy = vi.spyOn(EventCenter, 'emitEvent');
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
      expect(emitSpy).toHaveBeenCalledWith('ERROR', new Error('Error message'));
    });
  });

  describe('post', () => {
    it('should send POST request and return data', async () => {
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

    it('should set Content-Type to application/json', async () => {
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

    it('should support object-style params as JSON body', async () => {
      const mockData = { id: 1, name: 'Created' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: mockData }),
      });

      const result = await HttpClient.post<typeof mockData>({
        path: 'test/path',
        params: { name: 'test' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'test' }),
        }),
      );
      expect(result).toEqual(mockData);
    });

    it('should pass through FormData params', async () => {
      const formData = new FormData();
      formData.append('file', 'content');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.post({
        path: 'test/path',
        params: formData,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path'),
        expect.objectContaining({
          method: 'POST',
          body: formData,
        }),
      );
    });

    it('should support object-style params with signal', async () => {
      const abortController = HttpClient.createAbortController();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.post({
        path: 'test/path',
        params: { name: 'test' },
        signal: abortController.signal,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          signal: abortController.signal,
        }),
      );
    });
  });

  describe('del', () => {
    it('should send DELETE request', async () => {
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

    it('should support object-style params as query string', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.del({
        path: 'test/path',
        params: { id: 123 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path?id=123'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('put', () => {
    it('should support object-style params as JSON body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ code: '0000', message: 'success', data: null }),
      });

      await HttpClient.put({
        path: 'test/path',
        params: { name: 'updated' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('test/path'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'updated' }),
        }),
      );
    });
  });

  describe('retry mechanism', () => {
    it('should retry on 500 error', async () => {
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

    it('should retry on 429 error', async () => {
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
});
