import { serve } from '@hono/node-server';

import { logger } from '@backend/utils';

import { app } from './app';
import { startTokenCleanup } from './features/cms/auth/whitelist-cleanup';

const port = Number(process.env.PORT) || 9090;

serve({
  fetch: app.fetch,
  port,
});

startTokenCleanup();

logger.info(`Server running on http://localhost:${port}`);
