import { describe, it, expect } from 'vitest';

import { safeNumber, safeParse } from './safe-type';

describe('safeNumber', () => {
  it('returns the number for valid numeric strings', () => {
    expect(safeNumber('42')).toBe(42);
    expect(safeNumber('3.14')).toBe(3.14);
    expect(safeNumber('0')).toBe(0);
  });

  it('returns default value for invalid inputs', () => {
    expect(safeNumber('abc')).toBe(0);
    expect(safeNumber('')).toBe(0);
    expect(safeNumber('NaN')).toBe(0);
  });

  it('uses custom default value when provided', () => {
    expect(safeNumber('abc', 10)).toBe(10);
    expect(safeNumber('', -1)).toBe(-1);
  });

  it('returns default for Infinity string since it is not finite', () => {
    expect(safeNumber('Infinity')).toBe(0);
    expect(safeNumber('Infinity', 10)).toBe(10);
  });
});

describe('safeParse', () => {
  it('parses valid JSON strings', () => {
    expect(safeParse<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
    expect(safeParse<string[]>('["a","b"]')).toEqual(['a', 'b']);
  });

  it('returns null for invalid JSON', () => {
    expect(safeParse('not-json')).toBeNull();
    expect(safeParse('')).toBeNull();
  });

  it('returns defaultValue for invalid JSON', () => {
    expect(safeParse('not-json', { fallback: true })).toEqual({
      fallback: true,
    });
  });

  it('returns defaultValue for null/undefined input', () => {
    expect(safeParse(null, [])).toEqual([]);
    expect(safeParse(undefined, 'default')).toBe('default');
  });

  it('returns null for null/undefined when no default', () => {
    expect(safeParse(null)).toBeNull();
    expect(safeParse(undefined)).toBeNull();
  });

  it('uses provided default for falsy parsed result', () => {
    expect(safeParse('null', 'fallback')).toBe('fallback');
  });
});
