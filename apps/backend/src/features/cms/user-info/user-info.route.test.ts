import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

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
  app.route('/', userInfoRoutes);
  return app;
};

describe('userInfoRoutes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /user-info', () => {
    it('returns user info', async () => {
      mockUserInfoService.get.mockResolvedValue({ name: 'Admin' });
      const app = createApp();

      const res = await app.request('/user-info');
      const body = await res.json();

      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Admin');
    });

    it('throws on service error', async () => {
      mockUserInfoService.get.mockRejectedValue(new Error('fail'));
      const app = createApp();

      const res = await app.request('/user-info');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /user-info/update', () => {
    it('updates user info', async () => {
      mockUserInfoService.update.mockResolvedValue({ name: 'Updated' });
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
      mockUserInfoService.update.mockResolvedValue(null);
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

    it('throws on service error', async () => {
      mockUserInfoService.update.mockRejectedValue(new Error('fail'));
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
      expect(res.status).toBe(500);
    });
  });
});
