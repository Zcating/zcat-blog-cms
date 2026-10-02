/**
 * Tests for the unauthorized-error predicate.
 *
 * The predicate is the load-bearing decision for the "401 clears the
 * private Query cache" rule, so it is tested against every shape an
 * unauthorized rejection can take:
 *
 *   1. The raw `UnauthorizedError` instance — the same-process path
 *      (SSR, and any future transport that keeps the class).
 *   2. The COOKIE-ABSENT path, which is case 1 after the RPC round
 *      trip. Measured, not assumed: `UnauthorizedError` carries
 *      `name`/`code`/`message`, but `@tanstack/start-server-core`
 *      serializes a rejected handler with `toCrossJSONAsync` using
 *      `@tanstack/router-core`'s `ShallowErrorPlugin`, whose `test` is
 *      `value instanceof Error` and whose `parse` keeps ONLY `message`.
 *      Deserializing yields `new Error(message)` — so on the client
 *      `name` is `'Error'` and `code` is gone. This test performs that
 *      exact round trip and fails loudly if the transport ever changes
 *      shape again.
 *   3. The BACKEND-REJECTION path — the case an EXPIRED or REVOKED JWT
 *      actually takes, and the common one. The cookie is still present,
 *      so the presence-only middleware lets the call through and
 *      `envelopeToApiError` throws a plain `ApiError` OBJECT
 *      (`{ _tag, message }`), never an `Error`. Seroval therefore
 *      serializes it as an ordinary object: `ShallowErrorPlugin.test`
 *      never matches, so the value is NOT an `instanceof Error` and
 *      BOTH `_tag` and `message` survive the round trip intact. The
 *      backend answers an auth rejection with `{ code: 'ERR0002' }`
 *      (see `apps/backend/src/middleware/auth.ts`), and
 *      `mapResultCodeToTag('ERR0002')` is the tag `'LoginError'`.
 *   4. Negative shapes that must NOT be treated as unauthorized — a
 *      wiped cache on a server hiccup is a data-loss bug. An ordinary
 *      backend 500 is `ERR0006` → `'UnknownError'`.
 */

import { defaultSerovalDeserializerPlugins } from '@tanstack/router-core/ssr/server';
import { fromCrossJSON, toCrossJSONAsync } from 'seroval';
import { describe, expect, it } from 'vitest';

import { UnauthorizedError } from '../../server/auth-middleware';
import {
  isUnauthorizedError,
  UNAUTHORIZED_ERROR_CODE,
  UNAUTHORIZED_ERROR_TAG,
} from './unauthorized';

async function acrossRpcBoundary(error: Error): Promise<Error> {
  const payload = JSON.parse(
    JSON.stringify(
      await toCrossJSONAsync(error, {
        refs: new Map(),
        plugins: defaultSerovalDeserializerPlugins,
      }),
    ),
  );
  return fromCrossJSON(payload, {
    plugins: defaultSerovalDeserializerPlugins,
  }) as Error;
}

async function apiErrorAcrossRpcBoundary(apiError: unknown): Promise<unknown> {
  const envelope = { result: undefined, error: apiError, context: {} };
  const payload = JSON.parse(
    JSON.stringify(
      await toCrossJSONAsync(envelope, {
        refs: new Map(),
        plugins: defaultSerovalDeserializerPlugins,
      }),
    ),
  );
  const clientSide = fromCrossJSON(payload, {
    plugins: defaultSerovalDeserializerPlugins,
  }) as { error: unknown };
  return clientSide.error;
}

describe('isUnauthorizedError', () => {
  it('recognises the raw UnauthorizedError instance by name and code', () => {
    const error = new UnauthorizedError();

    expect(error.name).toBe(UNAUTHORIZED_ERROR_CODE);
    expect(error.code).toBe(UNAUTHORIZED_ERROR_CODE);
    expect(error.message).toBe(UNAUTHORIZED_ERROR_CODE);
    expect(isUnauthorizedError(error)).toBe(true);
  });

  it('recognises the value that survives the RPC boundary', async () => {
    const clientSide = await acrossRpcBoundary(new UnauthorizedError());

    expect(clientSide).toBeInstanceOf(Error);
    expect(clientSide.name).toBe('Error');
    expect((clientSide as Error & { code?: string }).code).toBeUndefined();
    expect(isUnauthorizedError(clientSide)).toBe(true);
  });

  it('does not match an ordinary Error', () => {
    expect(isUnauthorizedError(new Error('boom'))).toBe(false);
  });

  it('recognises the backend auth-rejection ApiError by its _tag', () => {
    expect(UNAUTHORIZED_ERROR_TAG).toBe('LoginError');
    expect(
      isUnauthorizedError({ _tag: 'LoginError', message: 'Unauthorized' }),
    ).toBe(true);
  });

  it('recognises the backend auth-rejection ApiError that survives the RPC boundary', async () => {
    const clientSide = await apiErrorAcrossRpcBoundary({
      _tag: 'LoginError',
      message: 'Unauthorized',
    });

    expect(clientSide).not.toBeInstanceOf(Error);
    expect(clientSide).toEqual({ _tag: 'LoginError', message: 'Unauthorized' });
    expect(isUnauthorizedError(clientSide)).toBe(true);
  });

  it('does not match the ApiError an ordinary backend 500 produces', async () => {
    const clientSide = await apiErrorAcrossRpcBoundary({
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    });

    expect(isUnauthorizedError(clientSide)).toBe(false);
  });

  it('does not match the non-auth ApiError tags', () => {
    for (const tag of [
      'DatabaseError',
      'UploadError',
      'ValidationError',
      'RegisterError',
      'UnknownError',
    ]) {
      expect(isUnauthorizedError({ _tag: tag, message: 'boom' })).toBe(false);
    }
  });

  it('does not match a non-auth ApiError payload', () => {
    expect(isUnauthorizedError({ _tag: 'UnknownError', message: 'boom' })).toBe(
      false,
    );
  });

  it('does not match non-object values', () => {
    expect(isUnauthorizedError('UnauthorizedError')).toBe(false);
    expect(isUnauthorizedError(null)).toBe(false);
    expect(isUnauthorizedError(undefined)).toBe(false);
  });
});
