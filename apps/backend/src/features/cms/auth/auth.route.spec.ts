import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('./auth.service', () => ({
  authService: mockAuthService,
}));

import authRoutes from './auth.route';

const createApp = () => {
  const app = new Hono();
  app.route('/', authRoutes);
  return app;
};

describe('authRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('returns 200 with accessToken on successful login', async () => {
      mockAuthService.login.mockResolvedValue({ accessToken: 'token123' });
      const app = createApp();

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'pass' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBe('0000');
      expect(body.data.accessToken).toBe('token123');
    });

    it('returns login error when credentials are invalid', async () => {
      mockAuthService.login.mockResolvedValue(null);
      const app = createApp();

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'bad', password: 'wrong' }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0002');
      expect(body.message).toBe('用户名或密码错误');
    });

    it('returns unknown error on service exception', async () => {
      mockAuthService.login.mockRejectedValue(new Error('db error'));
      const app = createApp();

      const res = await app.request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'pass' }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /auth/register', () => {
    it('registers successfully', async () => {
      mockAuthService.register.mockResolvedValue({
        code: 'SUCCESS',
        accessToken: 'reg-token',
      });
      const app = createApp();

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          password: 'pass',
          email: 'e@m.com',
        }),
      });

      const body = await res.json();
      expect(body.code).toBe('0000');
      expect(body.data.accessToken).toBe('reg-token');
    });

    it('returns register limit', async () => {
      mockAuthService.register.mockResolvedValue({ code: 'REGISTER_LIMIT' });
      const app = createApp();

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'u',
          password: 'p',
          email: 'e@m.com',
        }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0001');
    });

    it('returns user exists error', async () => {
      mockAuthService.register.mockResolvedValue({ code: 'USER_EXISTS' });
      const app = createApp();

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'existing',
          password: 'p',
          email: 'e@m.com',
        }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0001');
      expect(body.message).toBe('用户已存在');
    });

    it('returns unknown error on service exception', async () => {
      mockAuthService.register.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'u',
          password: 'p',
          email: 'e@m.com',
        }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /auth/logout', () => {
    it('returns success when valid Authorization header', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const app = createApp();

      const res = await app.request('/auth/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer some-token' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBe('0000');
      expect(mockAuthService.logout).toHaveBeenCalledWith('some-token');
    });

    it('returns success even without Authorization header', async () => {
      const app = createApp();

      const res = await app.request('/auth/logout', { method: 'POST' });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBe('0000');
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });
  });
});
