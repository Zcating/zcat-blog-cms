import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

// Mock the auth middleware to set a test user context
vi.mock('../../../middleware/auth', () => ({
  authMiddleware: vi.fn((c, next) => {
    c.set('user', { userId: 1, username: 'admin' });
    return next();
  }),
}));

// Mock the user info service
vi.mock('./user-info.service', () => ({
  userInfoService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

import { authMiddleware } from '../../../middleware/auth';

import userInfoRoutes from './user-info.route';
import { userInfoService } from './user-info.service';

const createTestApp = () => {
  const app = new Hono();
  app.use('*', authMiddleware);
  app.route('/', userInfoRoutes);
  return app;
};

describe('userInfo E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /user-info', () => {
    it('returns user info with valid auth context', async () => {
      vi.mocked(userInfoService.get).mockResolvedValue({
        name: 'Admin',
        contact: JSON.stringify({ email: 'admin@test.com', github: 'admin' }),
        occupation: 'Developer',
        avatar: '',
        aboutMe: 'About me',
        abstract: 'Abstract',
      });

      const app = createTestApp();
      const res = await app.request('/user-info');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Admin');
      expect(userInfoService.get).toHaveBeenCalledWith(1);
    });

    it('returns 500 when service throws', async () => {
      vi.mocked(userInfoService.get).mockRejectedValue(new Error('DB error'));

      const app = createTestApp();
      const res = await app.request('/user-info');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /user-info/update (RPC style, existing)', () => {
    it('updates user info successfully', async () => {
      vi.mocked(userInfoService.update).mockResolvedValue({
        name: 'Updated',
        contact: JSON.stringify({ email: 'u@test.com', github: 'u' }),
        occupation: 'Dev',
        avatar: '',
        aboutMe: '',
        abstract: '',
      });

      const app = createTestApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated',
          contact: { email: 'u@test.com', github: 'u' },
          occupation: 'Dev',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Updated');
    });

    it('returns 400 on validation error', async () => {
      const app = createTestApp();

      const res = await app.request('/user-info/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          contact: { email: 'invalid', github: '' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /user-info (RESTful style, fixing the 405 bug)', () => {
    it('returns 200 and updates user info via PUT', async () => {
      vi.mocked(userInfoService.update).mockResolvedValue({
        name: 'Updated Via PUT',
        contact: JSON.stringify({ email: 'put@test.com', github: 'put-user' }),
        occupation: 'Engineer',
        avatar: '',
        aboutMe: 'Updated via PUT',
        abstract: 'PUT test',
      });

      const app = createTestApp();

      const res = await app.request('/user-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Updated Via PUT',
          contact: { email: 'put@test.com', github: 'put-user' },
          occupation: 'Engineer',
          avatar: '',
          aboutMe: 'Updated via PUT',
          abstract: 'PUT test',
        }),
      });

      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Updated Via PUT');
      expect(userInfoService.update).toHaveBeenCalledWith(1, {
        name: 'Updated Via PUT',
        contact: { email: 'put@test.com', github: 'put-user' },
        occupation: 'Engineer',
        avatar: '',
        aboutMe: 'Updated via PUT',
        abstract: 'PUT test',
      });
    });

    it('returns 400 on PUT with invalid body', async () => {
      const app = createTestApp();

      const res = await app.request('/user-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          contact: { email: 'bad', github: '' },
          occupation: '',
          avatar: '',
          aboutMe: '',
          abstract: '',
        }),
      });

      expect(res.status).toBe(400);
    });

    it('returns 405 for unsupported methods on /user-info', async () => {
      const app = createTestApp();

      // DELETE should return 405
      const res = await app.request('/user-info', {
        method: 'DELETE',
      });
      expect(res.status).toBe(405);
    });
  });
});
