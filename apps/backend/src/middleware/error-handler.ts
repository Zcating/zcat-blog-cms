import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import { logger } from '@backend/utils';

import type { ErrorHandler } from 'hono';

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        code: 'ERR0005',
        message: err.issues.map((issue) => issue.message).join(', '),
      },
      200,
    );
  }

  if (err instanceof HTTPException) {
    return c.json(
      {
        code: err.status === 400 ? 'ERR0005' : 'ERR0006',
        message: err.message,
      },
      200,
    );
  }

  logger.error('Unhandled error:', err);
  return c.json(
    {
      code: 'ERR0006',
      message: 'Internal server error',
    },
    200,
  );
};
