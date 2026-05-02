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

  logger.error('Unhandled error:', err);
  return c.json(
    {
      code: 'ERR0006',
      message: 'Internal server error',
    },
    200,
  );
};
