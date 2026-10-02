import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  const createApp = () => {
    const app = new Hono();
    app.onError(errorHandler);
    app.get('/zod-error', (c) => {
      const schema = z.string().min(1);
      schema.parse('');
      return c.json({});
    });
    app.get('/generic-error', () => {
      throw new Error('something broke');
    });
    app.get('/http-exception-400', () => {
      throw new HTTPException(400, {
        message: 'Malformed JSON in request body',
      });
    });
    app.get('/http-exception-500', () => {
      throw new HTTPException(500, { message: 'Something went wrong' });
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

  it('handles HTTPException 400 with ERR0005', async () => {
    const app = createApp();

    const res = await app.request('/http-exception-400');
    const body = await res.json();

    expect(body.code).toBe('ERR0005');
    expect(body.message).toBe('Malformed JSON in request body');
  });

  it('handles HTTPException 500 with ERR0006', async () => {
    const app = createApp();

    const res = await app.request('/http-exception-500');
    const body = await res.json();

    expect(body.code).toBe('ERR0006');
    expect(body.message).toBe('Something went wrong');
  });
});
