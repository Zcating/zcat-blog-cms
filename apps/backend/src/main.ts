import { serve } from '@hono/node-server';

import { logger } from '@backend/utils';

import { app } from './app';
import { config } from './common/config.service';
import { startTokenCleanup } from './features/cms/auth/whitelist-cleanup';

serve({
  fetch: app.fetch,
  port: config.port,
});

startTokenCleanup();

logger.info(`Server running on http://localhost:${config.port}`);
