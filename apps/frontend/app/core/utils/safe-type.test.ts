import dayjs from 'dayjs';
import { describe, it, expect } from 'vitest';

import { isString, safeArray, safeDateString } from './safe-type';

describe('isString', () => {
  it('应该返回 true 当值是字符串', () => {
    expect(isString('hello')).toBe(true);
    expect(isString('')).toBe(true);
  });

  it('应该返回 false 当值不是字符串', () => {
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
    expect(isString({})).toBe(false);
    expect(isString([])).toBe(false);
    expect(isString(true)).toBe(false);
  });
});

describe('safeArray', () => {
  it('应该返回数组当值是数组', () => {
    expect(safeArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(safeArray([])).toEqual([]);
  });

  it('应该返回默认值当值不是数组', () => {
    expect(safeArray(null)).toEqual([]);
    expect(safeArray(undefined)).toEqual([]);
    expect(safeArray('string')).toEqual([]);
    expect(safeArray(42)).toEqual([]);
  });

  it('应该使用自定义默认值', () => {
    expect(safeArray(null, [1])).toEqual([1]);
  });
});

describe('safeDateString', () => {
  it('应该格式化合法日期字符串', () => {
    const result = safeDateString('2024-01-15');
    expect(result).toBe('2024-01-15');
  });

  it('应该格式化 dayjs 对象', () => {
    const result = safeDateString(dayjs('2024-06-01'));
    expect(result).toBe('2024-06-01');
  });

  it('应该对非法日期返回默认值', () => {
    const result = safeDateString('invalid-date');
    expect(result).toBe('');
  });

  it('应该对 null 返回默认值', () => {
    const result = safeDateString(null);
    expect(result).toBe('');
  });

  it('应该对 undefined 返回今日日期（dayjs 行为）', () => {
    const result = safeDateString(undefined);
    const today = dayjs().format('YYYY-MM-DD');
    expect(result).toBe(today);
  });

  it('应该使用自定义默认值', () => {
    const result = safeDateString(null, 'N/A');
    expect(result).toBe('N/A');
  });
});
