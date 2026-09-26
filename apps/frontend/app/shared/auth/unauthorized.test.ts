/**
 * Tests for the unauthorized-error predicate.
 *
 * The predicate is the load-bearing decision for the "401 clears the
 * private Query cache" rule, so it is tested against every shape an
 * unauthorized rejection can take:
 *
 *   1. The raw `UnauthorizedError` instance — the same-process path
 *      (SSR, and any future transport that keeps the class).
 *   2. The value that actually arrives in the browser. Measured, not
 *      assumed: `UnauthorizedError` carries `name`/`code`/`message`, but
 *      `@tanstack/start-server-core` serializes a rejected handler with
 *      `toCrossJSONAsync` using `@tanstack/router-core`'s
 *      `ShallowErrorPlugin`, whose `test` is `value instanceof Error` and
 *      whose `parse` keeps ONLY `message`. Deserializing yields
 *      `new Error(message)` — so on the client `name` is `'Error'` and
 *      `code` is gone. This test performs that exact round trip and
 *      fails loudly if the transport ever changes shape again.
 *   3. Negative shapes that must NOT be treated as unauthorized — a
 *      wiped cache on a server hiccup is a data-loss bug.
 */

import { defaultSerovalDeserializerPlugins } from '@tanstack/router-core/ssr/server';
import { fromCrossJSON, toCrossJSONAsync } from 'seroval';
import { describe, expect, it } from 'vitest';

import { UnauthorizedError } from '../../server/auth-middleware';
import { isUnauthorizedError, UNAUTHORIZED_ERROR_CODE } from './unauthorized';

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
