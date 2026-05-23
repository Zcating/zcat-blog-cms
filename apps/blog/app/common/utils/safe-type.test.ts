import { describe, expect, it } from 'vitest';

import { isFunction, safeNumber, safePositiveNumber } from './safe-type';

describe('isFunction', () => {
  it('returns true for functions', () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction(Number)).toBe(true);
  });

  it('returns false for non-functions', () => {
    expect(isFunction(undefined)).toBe(false);
    expect(isFunction(null)).toBe(false);
    expect(isFunction(42)).toBe(false);
    expect(isFunction('string')).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction([])).toBe(false);
  });
});

describe('safeNumber', () => {
  it('returns the number for valid numeric input', () => {
    expect(safeNumber(42, 0)).toBe(42);
    expect(safeNumber('3.14', 0)).toBe(3.14);
  });

  it('returns the default value for NaN', () => {
    expect(safeNumber(NaN, 10)).toBe(10);
  });

  it('returns the default value for Infinity', () => {
    expect(safeNumber(Infinity, 10)).toBe(10);
    expect(safeNumber(-Infinity, 10)).toBe(10);
  });

  it('returns the default value for unparseable input', () => {
    expect(safeNumber('not-a-number', 0)).toBe(0);
    expect(safeNumber(undefined, 5)).toBe(5);
    expect(safeNumber(null, 5)).toBe(0); // Number(null) = 0, which is finite
  });
});

describe('safePositiveNumber', () => {
  it('returns the number when positive', () => {
    expect(safePositiveNumber(5, 1)).toBe(5);
    expect(safePositiveNumber('10', 1)).toBe(10);
  });

  it('returns the default value for zero or negative', () => {
    expect(safePositiveNumber(0, 1)).toBe(1);
    expect(safePositiveNumber(-5, 10)).toBe(10);
  });

  it('returns the default value for invalid input', () => {
    expect(safePositiveNumber(NaN, 1)).toBe(1);
    expect(safePositiveNumber('bad', 2)).toBe(2);
  });
});
