import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  const createApp = () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.get('/zod-error', () => {
      const schema = z.string().min(1);
      schema.parse('');
      return null;
    });
    app.get('/generic-error', () => {
      throw new Error('something broke');
    });
    return app;
  };

  it('handles ZodError with ERR0005', async () => {
    const app = createApp();

    const res = await app.request('/zod-error');
    const body = await res.json();

    expect(body.code).toBe('ERR0005');
    expect(body.message).toContain('Too small');
  });

  it('handles generic Error with ERR0006', async () => {
    const app = createApp();

    const res = await app.request('/generic-error');
    const body = await res.json();

    expect(body.code).toBe('ERR0006');
    expect(body.message).toBe('Internal server error');
  });
});
