import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

const mockJwt = vi.hoisted(() => ({
  verify: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({ default: mockJwt, ...mockJwt }));

import { authMiddleware } from './auth';

describe('authMiddleware', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createApp = () => {
    const app = new Hono();
    app.use('/protected/*', authMiddleware);
    app.get('/protected/data', (c) => {
      const user = c.get('user');
      return c.json({ userId: user.userId, username: user.username });
    });
    return app;
  };

  it('allows request with valid Bearer token', async () => {
    mockJwt.verify.mockReturnValue({ sub: '1', username: 'admin' });
    const app = createApp();

    const res = await app.request('/protected/data', {
      headers: { Authorization: 'Bearer valid-token' },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.userId).toBe(1);
    expect(body.username).toBe('admin');
  });

  it('returns 401 when no Authorization header', async () => {
    const app = createApp();

    const res = await app.request('/protected/data');

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('ERR0002');
  });

  it('returns 401 when Authorization is not Bearer', async () => {
    const app = createApp();

    const res = await app.request('/protected/data', {
      headers: { Authorization: 'Basic token' },
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 when token verification fails', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new Error('jwt error');
    });
    const app = createApp();

    const res = await app.request('/protected/data', {
      headers: { Authorization: 'Bearer bad-token' },
    });

    expect(res.status).toBe(401);
  });
});
