import { describe, expect, it } from 'vitest';

import { stringDateFormat } from './format';

describe('stringDateFormat', () => {
  it('formats an ISO date to YYYY-MM-DD', () => {
    expect(stringDateFormat('2026-05-19T12:34:56.000Z')).toBe('2026-05-19');
  });
});
