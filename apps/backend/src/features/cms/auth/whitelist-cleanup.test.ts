import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Effect } from 'effect';

import { appRuntime } from '@backend/common/effect';

const mockCleanupExpired = vi.hoisted(() => vi.fn());

vi.mock('./whitelist.service', () => ({
  tokenWhitelistService: {
    cleanupExpired: mockCleanupExpired,
  },
}));

import { cleanupOnce, cleanupProgram } from './whitelist-cleanup';

describe('tokenWhitelistCleanup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('runs a single cleanup iteration when the program is executed', async () => {
    mockCleanupExpired.mockReturnValue(Effect.succeed(0));
    await appRuntime.runPromise(cleanupOnce);
    expect(mockCleanupExpired).toHaveBeenCalledTimes(1);
  });

  it('exports a repeated cleanup program', () => {
    expect(cleanupProgram).toBeDefined();
    // The program should be a composed Effect (not a plain function).
    expect(typeof cleanupProgram).toBe('object');
  });
});