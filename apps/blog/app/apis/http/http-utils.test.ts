import { describe, expect, it } from 'vitest';

import { createQueryPath } from './http-utils';

describe('createQueryPath', () => {
  it('returns the path unchanged when no body', () => {
    expect(createQueryPath('blog/article/list')).toBe('blog/article/list');
  });

  it('appends query string for non-empty params', () => {
    const result = createQueryPath('blog/article/list', {
      page: '1',
      pageSize: '10',
    });
    expect(result).toBe('blog/article/list?page=1&pageSize=10');
  });

  it('filters out undefined and null values', () => {
    const result = createQueryPath('test', {
      a: '1',
      b: undefined as any,
      c: null as any,
    });
    expect(result).toBe('test?a=1');
  });

  it('handles empty params object', () => {
    const result = createQueryPath('path', {});
    expect(result).toBe('path');
  });
});
