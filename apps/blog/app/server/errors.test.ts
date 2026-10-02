import { describe, expect, it } from 'vitest';

import {
  ApiErrorException,
  envelopeToApiError,
  isNotFoundError,
  mapResultCodeToTag,
} from './errors';
import {
  parseEnvelope,
  responseValidationError,
  ResponseValidationError,
} from './result';
import { z } from 'zod';

const KNOWN_CODES = [
  ['ERR0001', 'RegisterError'],
  ['ERR0002', 'LoginError'],
  ['ERR0003', 'DatabaseError'],
  ['ERR0004', 'UploadError'],
  ['ERR0005', 'ValidationError'],
  ['ERR0006', 'UnknownError'],
  ['ERR0007', 'NotFound'],
] as const;

describe('envelopeToApiError', () => {
  it('returns null for a success envelope', () => {
    expect(
      envelopeToApiError({ code: '0000', message: 'success', data: { a: 1 } }),
    ).toBeNull();
  });

  it.each(KNOWN_CODES)('maps %s to the %s tag', (code, tag) => {
    expect(envelopeToApiError({ code, message: 'boom' })).toEqual({
      _tag: tag,
      message: 'boom',
    });
  });

  it('collapses an unknown code to UnknownError', () => {
    expect(envelopeToApiError({ code: 'ERR9999', message: 'weird' })).toEqual({
      _tag: 'UnknownError',
      message: 'weird',
    });
  });

  it('collapses a malformed envelope to UnknownError', () => {
    expect(envelopeToApiError({ message: 'no code' })).toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });
    expect(envelopeToApiError(null)).toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });
    expect(envelopeToApiError('nope')).toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });
  });

  it('never carries the envelope data payload into the error', () => {
    const secret = { password: 'hunter2', token: 'abc' };
    const apiError = envelopeToApiError({
      code: 'ERR0003',
      message: '数据库异常',
      data: secret,
    });

    expect(apiError).toEqual({ _tag: 'DatabaseError', message: '数据库异常' });
    expect(apiError).not.toHaveProperty('data');
    expect(JSON.stringify(apiError)).not.toContain('hunter2');
    expect(JSON.stringify(apiError)).not.toContain('token');
  });

  it('keeps the data payload out of the thrown exception too', () => {
    const apiError = envelopeToApiError({
      code: 'ERR0005',
      message: 'invalid',
      data: { password: 'hunter2' },
    });
    const thrown = new ApiErrorException(apiError!);

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).toBeInstanceOf(ApiErrorException);
    expect(thrown.message).toBe('invalid');
    expect(thrown.apiError).toEqual({
      _tag: 'ValidationError',
      message: 'invalid',
    });
    expect(thrown).not.toHaveProperty('data');
    expect(JSON.stringify(thrown.apiError)).not.toContain('hunter2');
  });
});

describe('mapResultCodeToTag', () => {
  it('returns null for the success code', () => {
    expect(mapResultCodeToTag('0000')).toBeNull();
  });

  it('returns null for a code that is not registered in the glossary', () => {
    expect(mapResultCodeToTag('ERR9999')).toBeNull();
  });
});

describe('isNotFoundError', () => {
  function fromEnvelope(body: unknown): ApiErrorException {
    const apiError = envelopeToApiError(body);
    if (!apiError) throw new Error('envelope carried no error');
    return new ApiErrorException(apiError);
  }

  it('classifies the missing-article envelope the backend actually sends', () => {
    const error = fromEnvelope({ code: 'ERR0007', message: '文章不存在' });

    expect(error.apiError).toEqual({ _tag: 'NotFound', message: '文章不存在' });
    expect(isNotFoundError(error)).toBe(true);
  });

  it('classifies the missing-album envelope the backend actually sends', () => {
    const error = fromEnvelope({ code: 'ERR0007', message: '相册不存在' });

    expect(error.apiError).toEqual({ _tag: 'NotFound', message: '相册不存在' });
    expect(isNotFoundError(error)).toBe(true);
  });

  it('classifies by code, so a reworded not-found message is still a not-found', () => {
    const error = fromEnvelope({ code: 'ERR0007', message: '该内容已被移除' });

    expect(isNotFoundError(error)).toBe(true);
  });

  it('keeps a denied token out of the not-found classification, because not-allowed is not does-not-exist', () => {
    const error = fromEnvelope({ code: 'ERR0002', message: '登录验证错误' });

    expect(error.apiError).toEqual({
      _tag: 'LoginError',
      message: '登录验证错误',
    });
    expect(isNotFoundError(error)).toBe(false);
  });

  it.each(['ERR0003', 'ERR0006'])(
    'keeps the genuine fault %s out of the not-found classification',
    (code) => {
      const error = fromEnvelope({ code, message: '数据库异常' });

      expect(isNotFoundError(error)).toBe(false);
    },
  );

  it('keeps a message that reads like a not-found out, when the code is a fault', () => {
    const error = fromEnvelope({ code: 'ERR0006', message: '文章不存在' });

    expect(isNotFoundError(error)).toBe(false);
  });

  it('ignores anything that is not an ApiErrorException', () => {
    expect(isNotFoundError(new Error('boom'))).toBe(false);
    expect(
      isNotFoundError(
        responseValidationError('bad', { code: 'ERR0007', message: 'x' }),
      ),
    ).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});

describe('parseEnvelope', () => {
  it('unwraps the data payload of a success envelope', () => {
    expect(
      parseEnvelope({ code: '0000', message: 'ok', data: { a: 1 } }),
    ).toEqual({ a: 1 });
  });

  it('validates the data payload against the provided schema', () => {
    const result = parseEnvelope(
      { code: '0000', message: 'ok', data: { a: 1 } },
      z.object({ a: z.number() }),
    );
    expect(result).toEqual({ a: 1 });
  });

  it('throws ResponseValidationError when a non-success code is passed in', () => {
    expect(() =>
      parseEnvelope({ code: 'ERR0003', message: 'boom', data: null }),
    ).toThrow(ResponseValidationError);
  });

  it('reports the failing data path in the issues', () => {
    let caught: unknown;
    try {
      parseEnvelope(
        { code: '0000', message: 'ok', data: { a: 'not a number' } },
        z.object({ a: z.number() }),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ResponseValidationError);
    expect(caught).toMatchObject({
      name: 'ResponseValidationError',
      issues: [{ path: 'data.a' }],
    });
  });
});

describe('responseValidationError', () => {
  it('carries the payload and the issues', () => {
    const error = responseValidationError('nope', { some: 'payload' }, [
      { path: 'data.x', message: 'bad' },
    ]);
    expect(error).toBeInstanceOf(ResponseValidationError);
    expect(error.payload).toEqual({ some: 'payload' });
    expect(error.issues).toEqual([{ path: 'data.x', message: 'bad' }]);
  });
});
