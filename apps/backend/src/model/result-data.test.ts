import { describe, expect, it } from 'vitest';

import { createResult, ResultCode } from './result-data';

describe('createResult', () => {
  it('creates success result', () => {
    const result = createResult({
      code: ResultCode.Success,
      message: '成功',
      data: { id: 1 },
    });
    expect(result).toEqual({
      code: '0000',
      message: '成功',
      data: { id: 1 },
    });
  });

  it('creates error result', () => {
    const result = createResult({
      code: ResultCode.ValidationError,
      message: '参数错误',
    });
    expect(result.code).toBe('ERR0005');
    expect(result.message).toBe('参数错误');
  });

  it('creates result without data', () => {
    const result = createResult({
      code: ResultCode.Success,
      message: 'ok',
    });
    expect(result.data).toBeUndefined();
  });

  it('throws for invalid code', () => {
    expect(() =>
      createResult({
        code: 'INVALID' as ResultCode,
        message: 'bad',
      }),
    ).toThrow('Invalid code');
  });
});
