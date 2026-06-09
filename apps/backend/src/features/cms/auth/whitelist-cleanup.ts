import { Effect, Schedule } from 'effect';

import { logger } from '@backend/utils';

import { tokenWhitelistService } from './whitelist.service';

/**
 * Single cleanup iteration. Exported separately so tests can run it
 * without the `Effect.repeat` schedule in the way.
 */
export const cleanupOnce = Effect.gen(function* () {
  const count = yield* tokenWhitelistService.cleanupExpired();
  if (count > 0) {
    logger.info(`Token cleanup: removed ${count} expired entries`);
  }
  return count;
});

/**
 * Long-running program that re-runs the cleanup every hour. Started from
 * `main.ts` via `appRuntime.runFork(cleanupProgram)`. Failures are logged
 * and swallowed so a transient error does not stop the schedule.
 */
export const cleanupProgram = cleanupOnce.pipe(
  Effect.repeat(Schedule.spaced('1 hour')),
  Effect.catchAllCause((cause) =>
    Effect.sync(() => logger.error('Token cleanup failed:', cause)),
  ),
);