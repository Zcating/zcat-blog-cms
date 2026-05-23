import './global';

import { describe, expect, it } from 'vitest';

describe('Promise.timeout', () => {
  it('resolves after the specified milliseconds', async () => {
    const start = Date.now();
    await Promise.timeout(50);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });
});
