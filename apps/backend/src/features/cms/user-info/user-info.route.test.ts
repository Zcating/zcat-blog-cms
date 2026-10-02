import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

const mockUserInfoService = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
}));

vi.mock('./user-info.service', () => ({
  userInfoService: mockUserInfoService,
}));

import userInfoRoutes from './user-info.route';

const createApp = () => {
  const app = new Hono();
  app.onError((err, c) =>
    c.json({ code: 'ERR0006', message: err.message }, 200),
  );
  app.route('/', userInfoRoutes);
  return app;
};

describe('userInfoRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /user-info', () => {
    it('returns user info', async () => {
      mockUserInfoService.get.mockReturnValue(Effect.succeed({ name: 'Admin' }));
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Admin');
    });

    it('returns error on service failure', async () => {
      mockUserInfoService.get.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });

    it('passes userId from auth context to service', async () => {
      mockUserInfoService.get.mockReturnValue(Effect.succeed({ name: 'Admin' }));
      const app = new Hono();
      app.use('*', (c, next) => {
        c.set('user', { userId: 5, username: 'test' });
        return next();
      });
      app.route('/', userInfoRoutes);

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(mockUserInfoService.get).toHaveBeenCalledWith(5);
    });
  });

  describe('POST /user-info/update', () => {
    it('updates user info', async () => {
      mockUserInfoService.update.mockReturnValue(Effect.succeed({ name: 'Updated' }));
      const app = createApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated',
          contact: { email: 'a@b.com', github: 'u' },
          occupation: 'Dev',
          avatar: 'a.jpg',
          aboutMe: 'Me',
          abstract: 'Abs',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('0000');
    });

    it('returns validation error on missing user', async () => {
      mockUserInfoService.update.mockReturnValue(Effect.succeed(null));
      const app = createApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          contact: { email: 'a@b.com', github: 'u' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0005');
    });

    it('returns error on service failure', async () => {
      mockUserInfoService.update.mockReturnValue(Effect.fail(new Error('fail')));
      const app = createApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          contact: { email: 'a@b.com', github: 'u' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });
      const body = await res.json();

      expect(body.code).toBe('ERR0006');
    });

    it('returns validation error on empty name', async () => {
      const app = createApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          contact: { email: 'a@b.com', github: 'u' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('returns validation error on invalid email', async () => {
      const app = createApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          contact: { email: 'not-an-email', github: 'u' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });

      expect(res.status).toBe(400);
    });
  });
});