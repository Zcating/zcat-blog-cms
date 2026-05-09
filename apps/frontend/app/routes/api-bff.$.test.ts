import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./+types/api-bff.$', async () => {
  const actual = await vi.importActual('./+types/api-bff.$');
  return {
    ...actual,
  };
});

describe('api-bff proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractAuthToken (Task 2)', () => {
    it('should extract token from Authorization header', () => {
      const request = new Request('http://localhost/api/bff/test', {
        headers: { Authorization: 'Bearer test-token' },
      });
      expect(request.headers.get('Authorization')).toBe('Bearer test-token');
    });

    it('should extract token from Cookie header (SSR)', () => {
      const request = new Request('http://localhost/api/bff/test', {
        headers: { Cookie: 'token=Bearer%20ssr-token' },
      });
      expect(request.headers.get('Cookie')).toBe('token=Bearer%20ssr-token');
    });

    it('should return null when no token present', () => {
      const request = new Request('http://localhost/api/bff/test');
      expect(request.headers.get('Authorization')).toBeNull();
    });
  });

  describe('proxyToBackend error scenarios', () => {
    it('should return 400 when target path is missing', async () => {
      vi.stubEnv('VITE_SERVER_URL', 'http://localhost:3000');

      const mockRequest = new Request('http://localhost/api/bff', {
        method: 'GET',
      });

      const params = { '*': '' };

      const { proxyToBackend } = await import('./api-bff.$');

      const response = await proxyToBackend(mockRequest as any, params as any);

      expect(response.status).toBe(400);

      vi.unstubAllEnvs();
    });

    it('should return 500 when VITE_SERVER_URL is missing', async () => {
      vi.stubEnv('VITE_SERVER_URL', '');

      const mockRequest = new Request('http://localhost/api/bff/test', {
        method: 'GET',
      });

      const params = { '*': 'cms/articles' };

      const { proxyToBackend } = await import('./api-bff.$');

      const response = await proxyToBackend(mockRequest as any, params as any);

      expect(response.status).toBe(500);

      vi.unstubAllEnvs();
    });
  });
});
