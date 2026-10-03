import { describe, expect, it } from 'vitest';

import { stringDateFormat } from './format';

describe('stringDateFormat', () => {
  it('formats an ISO date to YYYY-MM-DD in the pinned display timezone', () => {
    expect(stringDateFormat('2026-05-23T16:32:52.256Z')).toBe('2026-05-24');
  });
});
