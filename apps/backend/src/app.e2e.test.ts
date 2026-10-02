import { describe, expect, it } from 'vitest';

import { app } from './app';

describe('app e2e', () => {
  it('serves the health endpoint through the real app wiring', async () => {
    const res = await app.request('/api/health');
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ status: 'ok' });
  });

  it('keeps unknown routes as 404 in e2e mode', async () => {
    const res = await app.request('/api/not-found');

    expect(res.status).toBe(404);
  });
});
