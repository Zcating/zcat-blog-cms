/**
 * Protected server-function middleware.
 *
 * The middleware is the security boundary for any `createServerFn` that
 * reads or writes private data. It rejects a missing or empty session
 * Cookie BEFORE calling `next()` so an attacker cannot reach the
 * downstream handler by hitting the RPC endpoint directly.
 *
 * Per the TanStack Start execution model:
 *   - Route-level UX guards (`beforeLoad`, redirects) are NOT a
 *     substitute for this middleware. They protect navigation, not the
 *     server function itself.
 *   - The middleware MUST NOT consult any `redirectTo` / `to` field on
 *     the request context.
 *
 * The middleware is intentionally NOT a TanStack `createMiddleware()`
 * instance — domain code composes it into `createServerFn().middleware([...])`
 * via the factory exposed below. Tests pass a fake request context to
 * exercise the boundary without spinning up a live TanStack Start.
 */

import { createMiddleware } from '@tanstack/react-start';

import { authorizeFromCookie, liveCookieIO, type CookieIO } from './cookies';

/**
 * Thrown when a protected server function is called without a valid
 * session. The thrown value is an `Error` (not a redirect) so the RPC
 * caller sees a structured failure rather than an HTML redirect target.
 */
export class UnauthorizedError extends Error {
  readonly code = 'UnauthorizedError';
  readonly name = 'UnauthorizedError';

  constructor(message = 'Missing or invalid session') {
    super(message);
  }
}

/**
 * Context shape that domain middleware should accept. The middleware
 * itself never reads any field on this shape — it only consults the
 * injected `cookie` — but documenting the expected shape keeps callers
 * from accidentally passing auth state through the context object.
 */
export interface ProtectedFunctionContext {
  redirectTo?: string;
  userId?: string;
  [key: string]: unknown;
}

interface MiddlewareServerInput {
  next: (input?: unknown) => Promise<unknown>;
  context?: ProtectedFunctionContext;
}

/**
 * Build a TanStack Start middleware that enforces a valid session.
 *
 * Usage:
 *
 *   const protectedMiddleware = createProtectedFunctionMiddleware();
 *
 *   export const getMyData = createServerFn({ method: 'GET' })
 *     .middleware([protectedMiddleware])
 *     .handler(async () => {
 *       // session is guaranteed to be present here
 *     });
 *
 * The factory takes an optional `cookie` so tests can inject a fake
 * `CookieIO`. Production callers leave it empty and pick up
 * `liveCookieIO()` automatically.
 */
export function createProtectedFunctionMiddleware(
  options: { cookie?: CookieIO } = {},
) {
  const cookie = options.cookie ?? liveCookieIO();

  return createMiddleware({ type: 'function' }).server(async ({ next }) => {
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

/**
 * Internal test seam: invoke the protected-function gate synchronously.
 *
 * Mirrors what `createProtectedFunctionMiddleware().server()` does, but
 * takes the request context directly so tests can drive it without a
 * TanStack Start runtime.
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
