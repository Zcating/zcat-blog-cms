import { serve } from '@hono/node-server';

import { logger } from '@backend/utils';

import { app } from './app';
import { startTokenCleanup } from './features/cms/auth/whitelist-cleanup';

if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

const port = Number(process.env.PORT) || 9090;

serve({
  fetch: app.fetch,
  port,
});

startTokenCleanup();

logger.info(`Server running on http://localhost:${port}`);
