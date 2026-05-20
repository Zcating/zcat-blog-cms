import { Hono } from 'hono';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
}));

vi.mock('@backend/utils', () => ({
  logger: mockLogger,
}));

import { requestLogger } from './request-logger';

describe('requestLogger', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const createApp = () => {
    const app = new Hono();
    app.use('*', requestLogger);
    app.get('/success', (c) => c.json({ ok: true }));
    app.post('/success', (c) => c.json({ ok: true }));
    app.get('/not-found', (c) => c.json({ error: 'not found' }, 404));
    app.get('/server-error', () => {
      throw new Error('internal error');
    });
    app.get('/auth-success', (c) => {
      c.set('user', { userId: 1, username: 'admin' });
      return c.json({ ok: true });
    });
    app.get('/users/:id', (c) => {
      const id = c.req.param('id');
      return c.json({ id, name: 'test' });
    });
    app.get('/search', (c) => {
      const q = c.req.query('q');
      return c.json({ q, results: [] });
    });
    app.post('/data', async (c) => {
      const body = await c.req.json();
      return c.json({ received: body });
    });
    app.post('/sensitive', async (c) => {
      const body = await c.req.json();
      return c.json({ ok: true, data: body });
    });
    return app;
  };

  it('logs info for 2xx responses', async () => {
    const app = createApp();

    const res = await app.request('/success');

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledTimes(1);
    expect(mockLogger.info).toHaveBeenCalledWith('GET /success', {
      method: 'GET',
      path: '/success',
      status: 200,
      duration: expect.any(Number),
      response: { ok: true },
    });
  });

  it('logs info for POST requests', async () => {
    const app = createApp();

    const res = await app.request('/success', { method: 'POST' });

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('POST /success', {
      method: 'POST',
      path: '/success',
      status: 200,
      duration: expect.any(Number),
      response: { ok: true },
    });
  });

  it('logs warn for 4xx responses', async () => {
    const app = createApp();

    const res = await app.request('/not-found');

    expect(res.status).toBe(404);
    expect(mockLogger.warn).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledWith('GET /not-found', {
      method: 'GET',
      path: '/not-found',
      status: 404,
      duration: expect.any(Number),
      response: { error: 'not found' },
    });
  });

  it('logs error for 5xx responses', async () => {
    const app = createApp();

    const res = await app.request('/server-error');

    expect(res.status).toBe(500);
    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.error).toHaveBeenCalledWith('GET /server-error', {
      method: 'GET',
      path: '/server-error',
      status: 500,
      duration: expect.any(Number),
    });
  });

  it('includes user info in log data when available', async () => {
    const app = createApp();

    const res = await app.request('/auth-success');

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('GET /auth-success', {
      method: 'GET',
      path: '/auth-success',
      status: 200,
      duration: expect.any(Number),
      userId: 1,
      username: 'admin',
      response: { ok: true },
    });
  });

  it('logs path params', async () => {
    const app = createApp();

    const res = await app.request('/users/42');

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('GET /users/42', {
      method: 'GET',
      path: '/users/42',
      status: 200,
      duration: expect.any(Number),
      params: { id: '42' },
      response: { id: '42', name: 'test' },
    });
  });

  it('logs query params', async () => {
    const app = createApp();

    const res = await app.request('/search?q=hello');

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('GET /search', {
      method: 'GET',
      path: '/search',
      status: 200,
      duration: expect.any(Number),
      query: { q: 'hello' },
      response: { q: 'hello', results: [] },
    });
  });

  it('logs JSON request body', async () => {
    const app = createApp();

    const res = await app.request('/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'foo', content: 'bar' }),
    });

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('POST /data', {
      method: 'POST',
      path: '/data',
      status: 200,
      duration: expect.any(Number),
      body: { title: 'foo', content: 'bar' },
      response: { received: { title: 'foo', content: 'bar' } },
    });
  });

  it('masks sensitive fields in body and response', async () => {
    const app = createApp();

    const res = await app.request('/sensitive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'my-secret',
        token: 'jwt-token',
        hmac: 'some-hmac',
        nested: { password: 'nested-pwd' },
      }),
    });

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('POST /sensitive', {
      method: 'POST',
      path: '/sensitive',
      status: 200,
      duration: expect.any(Number),
      body: {
        username: 'admin',
        password: '***',
        token: '***',
        hmac: '***',
        nested: { password: '***' },
      },
      response: {
        ok: true,
        data: {
          username: 'admin',
          password: '***',
          token: '***',
          hmac: '***',
          nested: { password: '***' },
        },
      },
    });
  });

  it('handles non-JSON body gracefully', async () => {
    const app = createApp();

    const res = await app.request('/success', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'plain text',
    });

    expect(res.status).toBe(200);
    expect(mockLogger.info).toHaveBeenCalledWith('POST /success', {
      method: 'POST',
      path: '/success',
      status: 200,
      duration: expect.any(Number),
      response: { ok: true },
    });
  });
});
