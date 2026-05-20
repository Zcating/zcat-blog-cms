import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCleanupExpired = vi.hoisted(() => vi.fn());

vi.mock('./whitelist.service', () => ({
  tokenWhitelistService: {
    cleanupExpired: mockCleanupExpired,
  },
}));

import { startTokenCleanup, stopTokenCleanup } from './whitelist-cleanup';

describe('tokenWhitelistCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    stopTokenCleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('starts and stops cleanup interval', () => {
    startTokenCleanup();
    expect(mockCleanupExpired).not.toHaveBeenCalled();

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(mockCleanupExpired).toHaveBeenCalledTimes(1);

    stopTokenCleanup();
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(mockCleanupExpired).toHaveBeenCalledTimes(1);
  });

  it('does not start duplicate intervals', () => {
    startTokenCleanup();
    startTokenCleanup();

    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(mockCleanupExpired).toHaveBeenCalledTimes(1);
  });
});
