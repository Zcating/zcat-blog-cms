import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

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
import { errorHandler } from '../../../middleware/error-handler';

import userInfoRoutes from './user-info.route';
import { userInfoService } from './user-info.service';

const createTestApp = () => {
  const app = new Hono();
  app.onError(errorHandler);
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
      vi.mocked(userInfoService.get).mockReturnValue(
        Effect.succeed({
          name: 'Admin',
          contact: JSON.stringify({ email: 'admin@test.com', github: 'admin' }),
          occupation: 'Developer',
          avatar: '',
          aboutMe: 'About me',
          abstract: 'Abstract',
        } as any),
      );

      const app = createTestApp();
      const res = await app.request('/user-info');
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.code).toBe('0000');
      expect(body.data.name).toBe('Admin');
      expect(userInfoService.get).toHaveBeenCalledWith(1);
    });

    it('returns ERR0006 when service throws', async () => {
      vi.mocked(userInfoService.get).mockReturnValue(Effect.fail(new Error('DB error')));

      const app = createTestApp();
      const res = await app.request('/user-info');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.code).toBe('ERR0006');
    });
  });
});
