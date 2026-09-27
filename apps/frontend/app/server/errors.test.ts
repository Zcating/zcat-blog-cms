/**
 * Focused tests for the typed error conversion layer.
 *
 * Goals:
 * 1. Map a non-success ResultCode to the existing `ApiErrorTag`/`ApiError`
 *    vocabulary. Unknown codes collapse to `UnknownError`.
 * 2. Wrap the conversion in `envelopeToApiError` so server functions can
 *    throw a structured `ApiError` from any non-success envelope without
 *    leaking the envelope's `data` field.
 * 3. Pin the structural contract of the `ApiError` / `ApiErrorTag`
 *    types this module owns.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { mapResultCodeToTag as mapBlogCode } from '../../../blog/app/server/errors';

import {
  envelopeToApiError,
  isNotFoundError,
  mapResultCodeToTag,
  type ApiError,
  type ApiErrorTag,
} from './errors';

describe('mapResultCodeToTag', () => {
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
      ['ERR0007', 'NotFound'],
    ];
    for (const [code, tag] of cases) {
      expect(mapResultCodeToTag(code)).toBe(tag);
    }
  });

  it('returns null for unknown codes (does not invent a tag)', () => {
    expect(mapResultCodeToTag('NOPE')).toBeNull();
  });
});

describe('ApiErrorTag', () => {
  it('should be a union of ResultCode error tags', () => {
    const tag: ApiErrorTag = 'LoginError';
    expect(tag).toBe('LoginError');
  });
});

describe('ApiError', () => {
  it('should have _tag and message properties', () => {
    const error: ApiError = { _tag: 'LoginError', message: 'test' };
    expect(error._tag).toBe('LoginError');
    expect(error.message).toBe('test');
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

/** The exact bytes the backend sends: JSON drops an absent `data`. */
function wire(body: Record<string, unknown>): unknown {
  return JSON.parse(JSON.stringify(body));
}

describe('envelopeToApiError — real backend bodies with no data key', () => {
  it('maps the auth middleware 401 body to LoginError', () => {
    // apps/backend/src/middleware/auth.ts:21,35,44
    //   c.json({ code: 'ERR0002', message: 'Unauthorized' }, 401)
    // The wire body is exactly these two keys — no `data`.
    const result = envelopeToApiError(
      wire({ code: 'ERR0002', message: 'Unauthorized' }),
    );
    expect(result).toEqual({ _tag: 'LoginError', message: 'Unauthorized' });
  });

  it('maps every other ResultCode the backend emits without data', () => {
    // `createResult` (apps/backend/src/model/result-data.ts:46-56) always
    // writes `data: params.data`; when that is `undefined` the key is gone.
    const cases: Array<[string, string, ApiErrorTag]> = [
      ['ERR0001', 'Username already exists', 'RegisterError'],
      ['ERR0003', 'Database unavailable', 'DatabaseError'],
      ['ERR0004', 'Upload rejected', 'UploadError'],
      ['ERR0005', 'Request failed validation', 'ValidationError'],
      ['ERR0006', 'Internal Server Error', 'UnknownError'],
      ['ERR0007', '资源不存在', 'NotFound'],
    ];
    for (const [code, message, tag] of cases) {
      expect(envelopeToApiError(wire({ code, message }))).toEqual({
        _tag: tag,
        message,
      });
    }
  });

  it('still returns null for a success envelope that happens to omit data', () => {
    // A body with no `data` key and code `0000` is not an error. Callers
    // reach `parseEnvelope` for the payload, which keeps `data` mandatory.
    expect(
      envelopeToApiError(wire({ code: '0000', message: 'success' })),
    ).toBeNull();
  });

  it('still reports a body with no message as a malformed envelope', () => {
    // The loosened schema must not accept an envelope missing `message`.
    expect(envelopeToApiError(wire({ code: 'ERR0002' }))).toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });
  });

  it('still reports a non-object body as a malformed envelope', () => {
    expect(envelopeToApiError('Unauthorized')).toEqual({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });
  });
});

function fromEnvelope(body: unknown): unknown {
  const apiError = envelopeToApiError(body);
  if (!apiError) throw new Error('envelope carried no error');
  return apiError;
}

describe('isNotFoundError', () => {
  it('classifies the missing-resource envelope the backend actually sends', () => {
    const error = fromEnvelope({ code: 'ERR0007', message: '相册不存在' });

    expect(error).toEqual({ _tag: 'NotFound', message: '相册不存在' });
    expect(isNotFoundError(error)).toBe(true);
  });

  it('classifies by code, so a reworded not-found message is still a not-found', () => {
    expect(
      isNotFoundError(
        fromEnvelope({ code: 'ERR0007', message: '该内容已被移除' }),
      ),
    ).toBe(true);
  });

  it('keeps a denied token out, because not-allowed is not does-not-exist', () => {
    const error = fromEnvelope({ code: 'ERR0002', message: 'Unauthorized' });

    expect(error).toEqual({ _tag: 'LoginError', message: 'Unauthorized' });
    expect(isNotFoundError(error)).toBe(false);
  });

  it.each(['ERR0003', 'ERR0006'])(
    'keeps the genuine fault %s out of the not-found classification',
    (code) => {
      expect(
        isNotFoundError(fromEnvelope({ code, message: '数据库异常' })),
      ).toBe(false);
    },
  );

  it('keeps a message that reads like a not-found out, when the code is a fault', () => {
    expect(
      isNotFoundError(fromEnvelope({ code: 'ERR0006', message: '相册不存在' })),
    ).toBe(false);
  });

  it('ignores anything that is not a thrown ApiError', () => {
    expect(isNotFoundError(new Error('boom'))).toBe(false);
    expect(isNotFoundError({ _tag: 'UnknownError' })).toBe(false);
    expect(isNotFoundError('NotFound')).toBe(false);
    expect(isNotFoundError(null)).toBe(false);
    expect(isNotFoundError(undefined)).toBe(false);
  });
});

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const BACKEND_RESULT_DATA = join(
  REPO_ROOT,
  'apps',
  'backend',
  'src',
  'model',
  'result-data.ts',
);

function backendResultCodes(): string[] {
  const source = readFileSync(BACKEND_RESULT_DATA, 'utf8');
  return [
    ...new Set(
      [...source.matchAll(/=\s*'(0000|ERR\d+)'/g)].map((match) => match[1]),
    ),
  ];
}

const BACKEND_FAILURE_CODES = backendResultCodes().filter(
  (code) => code !== '0000',
);

const UNDECLARED_CODES = ['ERR0000', 'ERR0008', 'ERR0099', 'NOPE'];

describe('ResultCode mapping parity with the blog app', () => {
  it('derives the failure codes from the backend enum, not a copy of it', () => {
    expect(BACKEND_FAILURE_CODES).toEqual([
      'ERR0001',
      'ERR0002',
      'ERR0003',
      'ERR0004',
      'ERR0005',
      'ERR0006',
      'ERR0007',
    ]);
  });

  it.each(BACKEND_FAILURE_CODES)(
    'maps the backend failure code %s in this app',
    (code) => {
      expect(mapResultCodeToTag(code)).not.toBeNull();
    },
  );

  it.each(BACKEND_FAILURE_CODES)(
    'maps the backend failure code %s identically in both apps',
    (code) => {
      expect(mapResultCodeToTag(code)).toBe(mapBlogCode(code));
    },
  );

  it.each(UNDECLARED_CODES)(
    'leaves the code %s unmapped in both apps, so neither invents a tag',
    (code) => {
      expect(mapResultCodeToTag(code)).toBeNull();
      expect(mapBlogCode(code)).toBeNull();
    },
  );

  it('exposes the same tag vocabulary in both apps', () => {
    const tags: ApiErrorTag[] = [
      'LoginError',
      'RegisterError',
      'DatabaseError',
      'UploadError',
      'ValidationError',
      'NotFound',
      'UnknownError',
    ];

    for (const code of BACKEND_FAILURE_CODES) {
      const tag = mapResultCodeToTag(code);
      expect(tags).toContain(tag ?? null);
      expect(mapBlogCode(code)).toBe(tag ?? null);
    }
  });
});
