import { describe, it, expect } from 'vitest';

import { createQueryPath } from './http-utils';

describe('createQueryPath', () => {
  it('应该在无参数时返回原路径', () => {
    expect(createQueryPath('test/path')).toBe('test/path');
  });

  it('应该在无参数对象时返回原路径', () => {
    expect(createQueryPath('test/path', {})).toBe('test/path');
  });

  it('应该构建带查询参数的路径', () => {
    const result = createQueryPath('test/path', { page: '1', name: 'test' });
    expect(result).toBe('test/path?page=1&name=test');
  });

  it('应该过滤掉 null 值参数', () => {
    const result = createQueryPath('test/path', {
      page: '1',
      extra: null as unknown as string,
    });
    expect(result).toBe('test/path?page=1');
    expect(result).not.toContain('extra');
  });

  it('应该过滤掉 undefined 值参数', () => {
    const result = createQueryPath('test/path', {
      page: '1',
      extra: undefined as unknown as string,
    });
    expect(result).toBe('test/path?page=1');
    expect(result).not.toContain('extra');
  });

  it('应该处理空字符串值', () => {
    const result = createQueryPath('test/path', { q: '' });
    expect(result).toContain('q=');
  });

  it('应该对特殊字符进行 URL 编码', () => {
    const result = createQueryPath('search', { q: 'hello world' });
    expect(result).toContain('hello+world');
  });

  it('应该处理单个参数', () => {
    const result = createQueryPath('test/path', { id: '42' });
    expect(result).toBe('test/path?id=42');
  });
});
