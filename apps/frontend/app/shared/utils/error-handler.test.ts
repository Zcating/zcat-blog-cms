import { describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  redirect: (options: { to: string }) => ({ __redirect: options.to }),
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
    // 其他非 Error 类型用简单断言验证行为即可
    let thrown: unknown = undefined;
    try {
      errorHandler(42);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(42);

    thrown = undefined;
    try {
      errorHandler(null);
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBe(null);
  });
});
