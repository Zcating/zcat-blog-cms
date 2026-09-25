/**
 * Server-only test seam for the protected-function middleware.
 *
 * The runtime check that mirrors `createProtectedFunctionMiddleware()`
 * is exported as `runProtectedFunctionGate` so unit tests can drive
 * the gate without spinning up a live TanStack Start request context.
 *
 * The function lives in a `.server.ts` file because it touches
 * `liveCookieIO()`, which in turn pulls in the server-only Cookie
 * primitives from `@tanstack/react-start/server`. Keeping the seam
 * isolated ensures the import-protection plugin does not flag the
 * `auth-middleware.ts` module when it is referenced from the client
 * graph (e.g. by a route's `beforeLoad`).
 */

import { authorizeFromCookie, liveCookieIO, type CookieIO } from './cookies';

import { UnauthorizedError } from './auth-middleware';

export interface ProtectedFunctionContext {
  redirectTo?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface MiddlewareServerInput {
  next: (input?: unknown) => Promise<unknown>;
  context?: ProtectedFunctionContext;
}

/**
 * Invoke the protected-function gate synchronously.
 *
 * Mirrors what `createProtectedFunctionMiddleware().server()` does,
 * but takes the request context directly so tests can drive it
 * without a TanStack Start runtime.
 */
export async function runProtectedFunctionGate(
  input: MiddlewareServerInput,
  options: { cookie?: CookieIO } = {},
): Promise<unknown> {
  const cookie = options.cookie ?? liveCookieIO();
  const auth = authorizeFromCookie(cookie);
  if (!auth) {
    throw new UnauthorizedError();
  }
  return input.next();
}
