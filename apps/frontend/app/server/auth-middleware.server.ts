/*
 * Server-only test seam for the protected-function middleware.
 *
 * The runtime check that mirrors `createProtectedFunctionMiddleware()`
 * is exported as `runProtectedFunctionGate` so unit tests can drive
 * the gate without spinning up a live TanStack Start request context.
 *
 * The file keeps its `.server.ts` name so import protection can never
 * place it in a client graph.
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
  const cookie = options.cookie ?? (await liveCookieIO());
  const auth = authorizeFromCookie(cookie);
  if (!auth) {
    throw new UnauthorizedError();
  }
  return input.next();
}
