import { describe, it, expect } from 'vitest';

import { unique } from './unique';

describe('unique', () => {
  it('returns a string with timestamp and random part separated by dash', () => {
    const id = unique();

    expect(id).toMatch(/^\d+-\d+$/);
  });

  it('returns unique values on successive calls', () => {
    const id1 = unique();
    const id2 = unique();

    expect(id1).not.toBe(id2);
  });
});
