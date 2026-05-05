import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.FRONTEND_URL = 'http://localhost:3000';
  process.env.BLOG_URL = 'http://localhost:1024';
});

vi.mock('./features/cms', () => ({
  cmsRoutes: new Hono(),
}));

vi.mock('./features/public', () => ({
  publicRoutes: new Hono(),
}));

import { app } from './app';

describe('app', () => {
  it('has health check endpoint', async () => {
    const res = await app.request('/health');
    const body = await res.json();

    expect(body).toEqual({ status: 'ok' });
  });

  it('has CORS headers on requests with Origin', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'http://localhost:3000' },
    });

    expect(res.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:3000',
    );
  });

  it('has CORS allow-methods on OPTIONS preflight', async () => {
    const res = await app.request('/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.headers.get('access-control-allow-methods')).toBeTruthy();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await app.request('/nonexistent');

    expect(res.status).toBe(404);
  });
});
