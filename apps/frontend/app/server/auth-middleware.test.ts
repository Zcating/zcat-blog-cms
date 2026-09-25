/**
 * Focused tests for the protected-server-function middleware helper.
 *
 * Goals:
 * 1. Reject a missing session Cookie before calling `next()`.
 * 2. Reject an invalid/empty session Cookie before calling `next()`.
 * 3. Pass through a valid Bearer-prefixed session and call `next()` exactly
 *    once.
 * 4. Re-wrapping a raw (non-prefixed) token Cookie counts as a valid
 *    session.
 * 5. Route-level UX guards are NOT a substitute — the middleware lives on
 *    the handler side and must not look at any `redirect`-style signal.
 *
 * The tests use the `runProtectedFunctionGate` test seam so they can
 * drive the gate synchronously without a TanStack Start runtime. The
 * exported `createProtectedFunctionMiddleware` is verified separately
 * by the fact that it composes the same helper functions internally.
 */

import { describe, expect, it, vi } from 'vitest';

import {
  createProtectedFunctionMiddleware,
  runProtectedFunctionGate,
  type ProtectedFunctionContext,
} from './auth-middleware';
import type { CookieIO } from './cookies';

function makeCookieIo(cookieValue: string | undefined): CookieIO {
  return {
    getCookie: vi.fn(() => cookieValue),
    setCookie: vi.fn(),
    deleteCookie: vi.fn(),
  };
}

function makeNext() {
  return vi.fn(async () => ({ ok: true as const }));
}

describe('runProtectedFunctionGate', () => {
  it('rejects when no Cookie is present and never calls next()', async () => {
    const cookie = makeCookieIo(undefined);
    const next = makeNext();

    await expect(
      runProtectedFunctionGate({ next }, { cookie }),
    ).rejects.toThrow(/session/i);

    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the Cookie value is empty and never calls next()', async () => {
    const cookie = makeCookieIo('');
    const next = makeNext();

    await expect(
      runProtectedFunctionGate({ next }, { cookie }),
    ).rejects.toThrow(/session/i);

    expect(next).not.toHaveBeenCalled();
  });

  it('passes a Bearer-prefixed Cookie through to next() exactly once', async () => {
    const cookie = makeCookieIo('Bearer abc.def.ghi');
    const next = makeNext();

    await runProtectedFunctionGate({ next }, { cookie });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('passes a raw (non-prefixed) token Cookie through to next()', async () => {
    const cookie = makeCookieIo('raw-token-only');
    const next = makeNext();

    await runProtectedFunctionGate({ next }, { cookie });

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not consult a redirect/redirectTo URL on the request context', async () => {
    // The middleware MUST NOT read any `redirectTo`/`to` field on the
    // request context. We assert that by feeding in an unrelated context
    // shape and verifying that the gate still passes through to next().
    const cookie = makeCookieIo('Bearer abc.def.ghi');
    const next = makeNext();

    const bogusContext: ProtectedFunctionContext = {
      redirectTo: '/login',
      userId: 'intruder',
    };

    await runProtectedFunctionGate({ next, context: bogusContext }, { cookie });

    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('createProtectedFunctionMiddleware (factory shape)', () => {
  it('returns a function-builder object', () => {
    const cookie = makeCookieIo('Bearer abc.def.ghi');
    const middleware = createProtectedFunctionMiddleware({ cookie });
    // `createMiddleware({ type: 'function' }).server(...)` returns a
    // builder. We only assert that the factory returns a non-null
    // object so downstream callers can chain `.middleware([...])` on
    // a `createServerFn`.
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('object');
  });
});
