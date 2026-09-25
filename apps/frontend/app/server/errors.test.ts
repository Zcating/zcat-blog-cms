/**
 * Focused tests for the typed error conversion layer.
 *
 * Goals:
 * 1. Map a non-success ResultCode to the existing `ApiErrorTag`/`ApiError`
 *    vocabulary. Unknown codes collapse to `UnknownError`.
 * 2. Wrap the conversion in `envelopeToApiError` so server functions can
 *    throw a structured `ApiError` from any non-success envelope without
 *    leaking the envelope's `data` field.
 * 3. Re-export the legacy `mapResultCodeToTag` so existing imports keep
 *    compiling until the Phase 4 teardown.
 */

import { describe, expect, it } from 'vitest';

import {
  envelopeToApiError,
  mapResultCodeToTag,
  type ApiError,
  type ApiErrorTag,
} from './errors';

describe('mapResultCodeToTag (compat re-export)', () => {
  it('returns null for the success code 0000', () => {
    expect(mapResultCodeToTag('0000')).toBeNull();
  });

  it('maps each known ERR code to the matching tag', () => {
    const cases: Array<[string, ApiErrorTag]> = [
      ['ERR0001', 'RegisterError'],
      ['ERR0002', 'LoginError'],
      ['ERR0003', 'DatabaseError'],
      ['ERR0004', 'UploadError'],
      ['ERR0005', 'ValidationError'],
      ['ERR0006', 'UnknownError'],
    ];
    for (const [code, tag] of cases) {
      expect(mapResultCodeToTag(code)).toBe(tag);
    }
  });

  it('returns null for unknown codes (does not invent a tag)', () => {
    expect(mapResultCodeToTag('NOPE')).toBeNull();
  });
});

describe('envelopeToApiError', () => {
  it('returns null for a success envelope', () => {
    const result = envelopeToApiError({
      code: '0000',
      message: 'ok',
      data: { id: 1 },
    });
    expect(result).toBeNull();
  });

  it('converts ERR0002 to a LoginError ApiError with the original message', () => {
    const result = envelopeToApiError({
      code: 'ERR0002',
      message: '用户名或密码错误',
      data: null,
    });
    expect(result).not.toBeNull();
    const err = result as ApiError;
    expect(err._tag).toBe('LoginError');
    expect(err.message).toBe('用户名或密码错误');
  });

  it('collapses an unknown ResultCode to UnknownError', () => {
    const result = envelopeToApiError({
      code: 'WEIRD',
      message: 'something broke',
      data: null,
    });
    expect(result).toEqual({
      _tag: 'UnknownError',
      message: 'something broke',
    });
  });

  it('never exposes the envelope data on the converted error', () => {
    const result = envelopeToApiError({
      code: 'ERR0002',
      message: 'login failed',
      data: { hint: 'leak me', internalId: 'x' },
    });
    expect(result).not.toBeNull();
    // `ApiError` only has `_tag` and `message` — guard the structural contract.
    expect(Object.keys(result as object).sort()).toEqual(['_tag', 'message']);
  });
});
