import { describe, it, expect, vi } from 'vitest';

vi.mock('react-router', () => ({
  redirect: (path: string) => ({ __redirect: path }),
}));

import { errorHandler } from './error-handler';

describe('errorHandler', () => {
  it('应该在 Unauthorized 错误时返回重定向', () => {
    const error = new Error('Unauthorized');
    const result = errorHandler(error);
    expect(result).toEqual({ __redirect: '/login' });
  });

  it('应该对非 Unauthorized 错误抛出原错误', () => {
    const error = new Error('Some other error');
    expect(() => errorHandler(error)).toThrow('Some other error');
  });

  it('应该对非 Error 类型抛出原值', () => {
    expect(() => errorHandler('string error')).toThrow('string error');
    expect(() => errorHandler(42)).toThrow();
    expect(() => errorHandler(null)).toThrow();
  });
});
