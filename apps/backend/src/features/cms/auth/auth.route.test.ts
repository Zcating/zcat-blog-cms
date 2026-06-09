import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

const mockAuthService = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  isValid: vi.fn(),
}));

vi.mock('./auth.service', () => ({
  authService: mockAuthService,
}));

import authRoutes from './auth.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', authRoutes);
  return app;
};

describe('authRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /login', () => {
    it('returns 200 with accessToken on successful login', async () => {
      mockAuthService.login.mockReturnValue(Effect.succeed({ accessToken: 'token123' }));
      const app = createApp();

      const res = await app.request('/login', {
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
      mockAuthService.login.mockReturnValue(Effect.succeed(null));
      const app = createApp();

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'bad', password: 'wrong' }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0002');
      expect(body.message).toBe('用户名或密码错误');
    });

    it('returns unknown error on service exception', async () => {
      mockAuthService.login.mockReturnValue(Effect.fail(new Error('db error')));
      const app = createApp();

      const res = await app.request('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'pass' }),
      });

      const body = await res.json();
      expect(body.code).toBe('ERR0006');
    });
  });

  describe('POST /is-valid', () => {
    it('returns valid: false when no token', async () => {
      const app = createApp();

      const res = await app.request('/is-valid', { method: 'POST' });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.valid).toBe(false);
    });

    it('returns valid result for valid token', async () => {
      mockAuthService.isValid.mockReturnValue(Effect.succeed(true));
      const app = createApp();

      const res = await app.request('/is-valid', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.valid).toBe(true);
    });
  });

  describe('POST /logout', () => {
    it('returns success', async () => {
      mockAuthService.logout.mockReturnValue(Effect.succeed(undefined));
      const app = createApp();

      const res = await app.request('/logout', {
        method: 'POST',
        headers: { Authorization: 'Bearer valid-token' },
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });
  });

  describe('POST /register', () => {
    it('registers successfully', async () => {
      mockAuthService.register.mockReturnValue(
        Effect.succeed({
          code: 'SUCCESS',
          accessToken: 'reg-token',
        }),
      );
      const app = createApp();

      const res = await app.request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          password: 'pass',
          email: 'a@b.com',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.accessToken).toBe('reg-token');
    });

    it('returns register error when register is disabled', async () => {
      mockAuthService.register.mockReturnValue(
        Effect.succeed({ code: 'REGISTER_LIMIT' }),
      );
      const app = createApp();

      const res = await app.request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          password: 'pass',
          email: 'a@b.com',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0001');
    });

    it('returns register error when user exists', async () => {
      mockAuthService.register.mockReturnValue(
        Effect.succeed({ code: 'USER_EXISTS' }),
      );
      const app = createApp();

      const res = await app.request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'taken',
          password: 'pass',
          email: 'a@b.com',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0001');
    });

    it('returns unknown error on service exception', async () => {
      mockAuthService.register.mockReturnValue(
        Effect.fail(new Error('db error')),
      );
      const app = createApp();

      const res = await app.request('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'newuser',
          password: 'pass',
          email: 'a@b.com',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });
  });
});