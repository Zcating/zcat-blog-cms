import { serve } from '@hono/node-server';

import { appRuntime } from './common/effect/runtime';
import { config } from './common/config.service';
import { app } from './app';
import { cleanupProgram } from './features/cms/auth/whitelist-cleanup';
import { logger } from './utils';

serve({
  fetch: app.fetch,
  port: config.port,
});

appRuntime.runFork(cleanupProgram);

logger.info(`Server running on http://localhost:${config.port}`);