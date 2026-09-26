/**
 * Public Cookie / session helpers for the TanStack Start server boundary.
 *
 * These helpers wrap the public `@tanstack/react-start/server` API
 * (`getCookie`, `setCookie`, `deleteCookie`) and preserve the existing
 * `token` Cookie convention:
 *
 *   - HttpOnly (defeats XSS-based exfiltration).
 *   - SameSite=Strict (per `CONTEXT.md`).
 *   - `Bearer <jwt>` value format (the backend whitelist accepts either
 *     a raw token or a Bearer-prefixed one).
 *
 * The helpers are written as pure functions over a `CookieIO` interface
 * so they can be unit-tested without a live TanStack Start request
 * context. `liveCookieIO` resolves the real implementation per request
 * through `createIsomorphicFn` plus a dynamic import of
 * `@tanstack/react-start/server`, so this module keeps no static
 * server-only specifier for the client bundle to resolve.
 */

import { createIsomorphicFn } from '@tanstack/react-start';

/** Name of the session cookie that carries the JWT. */
export const TOKEN_COOKIE_NAME = 'token';

/**
 * Minimal Cookie I/O surface. Exists so tests can inject fakes without
 * spinning up a TanStack Start request context.
 */
export interface CookieIO {
  getCookie: (name: string) => string | undefined;
  setCookie: (
    name: string,
    value: string,
    options?: Record<string, unknown>,
  ) => void;
  deleteCookie: (name: string, options?: Record<string, unknown>) => void;
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
};

const resolveLiveCookieIO = createIsomorphicFn()
  .server(async (): Promise<CookieIO> => {
    const { getCookie, setCookie, deleteCookie } =
      await import('@tanstack/react-start/server');
    return {
      getCookie: (name) => getCookie(name),
      setCookie: (name, value, options) => {
        setCookie(name, value, options as Parameters<typeof setCookie>[2]);
      },
      deleteCookie: (name, options) => {
        deleteCookie(name, options as Parameters<typeof deleteCookie>[1]);
      },
    };
  })
  .client((): Promise<CookieIO> => {
    throw new Error('liveCookieIO can only be called on the server');
  });

/**
 * Resolve the live `CookieIO` for the current request.
 *
 * The server branch is asynchronous because `@tanstack/react-start/server`
 * is reached through a dynamic import, so every caller must `await` it.
 */
export async function liveCookieIO(): Promise<CookieIO> {
  return resolveLiveCookieIO();
}

/**
 * Write the session token Cookie using the standard flags.
 *
 * Accepts either a raw token (`abc.def.ghi`) or a Bearer-prefixed value
 * (`Bearer abc.def.ghi`). The caller is responsible for the format — the
 * helper never re-wraps.
 */
export function setSessionCookie(token: string, cookie: CookieIO): void {
  cookie.setCookie(TOKEN_COOKIE_NAME, token, { ...COOKIE_OPTIONS });
}

/**
 * Clear the session token Cookie. Uses `Max-Age=0` to signal expiry.
 */
export function clearSessionCookie(cookie: CookieIO): void {
  cookie.deleteCookie(TOKEN_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Read the session Cookie and strip exactly ONE leading `Bearer ` prefix.
 *
 * Returns `null` when the Cookie is missing or empty. The Cookie value
 * is preserved as-is when there is no Bearer prefix — the JWT may be
 * stored in either format and downstream code re-wraps it.
 */
export function parseSessionCookie(cookie: CookieIO): string | null {
  const raw = cookie.getCookie(TOKEN_COOKIE_NAME);
  if (!raw) return null;
  if (raw.length === 0) return null;
  return raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw;
}

/**
 * Resolve the Cookie into a Bearer-prefixed string suitable for an
 * outbound `Authorization` header.
 *
 * - Missing/empty Cookie -> `null` (caller should reject the request).
 * - Cookie already prefixed -> returned verbatim.
 * - Raw token Cookie -> re-wrapped to `Bearer <token>`.
 */
export function authorizeFromCookie(cookie: CookieIO): string | null {
  const raw = cookie.getCookie(TOKEN_COOKIE_NAME);
  if (!raw || raw.length === 0) return null;
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}

/**
 * Build a ready-to-use `Authorization` header value from the session
 * Cookie. Returns `null` when there is no session.
 *
 * Convenience wrapper around `authorizeFromCookie` for callers that
 * only need the header value.
 */
export function buildAuthorizationHeader(cookie: CookieIO): string | null {
  return authorizeFromCookie(cookie);
}
