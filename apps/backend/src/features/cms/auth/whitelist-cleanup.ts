import { logger } from '@backend/utils';

import { tokenWhitelistService } from './whitelist.service';

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

export function startTokenCleanup() {
  if (cleanupInterval) {
    return;
  }

  logger.info('Token cleanup scheduler started');

  cleanupInterval = setInterval(async () => {
    try {
      const count = await tokenWhitelistService.cleanupExpired();
      if (count > 0) {
        logger.info(`Token cleanup: removed ${count} expired entries`);
      }
    } catch (error) {
      logger.error('Token cleanup failed:', error);
    }
  }, CLEANUP_INTERVAL_MS);
}

export function stopTokenCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    logger.info('Token cleanup scheduler stopped');
  }
}
