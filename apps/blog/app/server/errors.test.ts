import { describe, expect, it } from 'vitest';

import {
  ApiErrorException,
  envelopeToApiError,
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
  it('returns null for the success code and for unknown codes', () => {
    expect(mapResultCodeToTag('0000')).toBeNull();
    expect(mapResultCodeToTag('ERR0007')).toBeNull();
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
