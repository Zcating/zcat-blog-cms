/*
 * The security boundary for any `createServerFn` that reads or writes
 * private data: it rejects a missing session Cookie BEFORE `next()`, so
 * the RPC endpoint cannot be hit directly. Route-level guards
 * (`beforeLoad`, redirects) are not a substitute — they protect
 * navigation, not the function.
 *
 * The runtime test seam `runProtectedFunctionGate` lives in the sibling
 * `auth-middleware.server.ts` so the seam stays out of the production
 * module graph.
 */

import { createMiddleware } from '@tanstack/react-start';

import { UNAUTHORIZED_ERROR_CODE } from '@cms/shared/auth/unauthorized';

import { authorizeFromCookie, liveCookieIO, type CookieIO } from './cookies';

/**
 * The default message is the machine code, not prose: the RPC boundary
 * keeps only `message`, so it is the one field the client can match on
 * to recognise the rejection. See `@cms/shared/auth/unauthorized`.
 */
export class UnauthorizedError extends Error {
  readonly code = UNAUTHORIZED_ERROR_CODE;
  readonly name = UNAUTHORIZED_ERROR_CODE;

  constructor(message = UNAUTHORIZED_ERROR_CODE) {
    super(message);
  }
}

export interface ProtectedFunctionContext {
  redirectTo?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * The `cookie` option exists so tests can inject a fake `CookieIO`.
 * Production callers leave it empty and pick up `liveCookieIO()`
 * automatically — that call is intentionally inside the `.server()`
 * closure so the TanStack Start compiler strips it (and the server-only
 * Cookie import it reaches) from the client bundle.
 */
export function createProtectedFunctionMiddleware(
  options: { cookie?: CookieIO } = {},
) {
  return createMiddleware({ type: 'function' }).server(async ({ next }) => {
    const cookie = options.cookie ?? (await liveCookieIO());
    const auth = authorizeFromCookie(cookie);
    if (!auth) {
      throw new UnauthorizedError();
    }
    // We deliberately do NOT pass any auth context to `next()` here.
    // Domain middleware is responsible for translating the Cookie
    // into a typed session principal via the shared helpers.
    return next();
  });
}
