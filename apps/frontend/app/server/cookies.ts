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
 * context. The default `liveCookieIO` factory resolves the live getters
 * from `@tanstack/react-start/server`.
 */

import {
  deleteCookie as startDeleteCookie,
  getCookie as startGetCookie,
  setCookie as startSetCookie,
} from '@tanstack/react-start/server';

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

/**
 * Live implementation backed by `@tanstack/react-start/server`.
 *
 * Captures references at call time so request-context swapping works
 * correctly across server invocations.
 */
export function liveCookieIO(): CookieIO {
  return {
    getCookie: (name) => startGetCookie(name),
    setCookie: (name, value, options) => {
      // The public API accepts a CookieSerializeOptions object; tests
      // pass a plain Record, which is structurally compatible.
      startSetCookie(
        name,
        value,
        options as Parameters<typeof startSetCookie>[2],
      );
    },
    deleteCookie: (name, options) => {
      startDeleteCookie(
        name,
        options as Parameters<typeof startDeleteCookie>[1],
      );
    },
  };
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
};

/**
 * Write the session token Cookie using the standard flags.
 *
 * Accepts either a raw token (`abc.def.ghi`) or a Bearer-prefixed value
 * (`Bearer abc.def.ghi`). The caller is responsible for the format — the
 * helper never re-wraps.
 */
export function setSessionCookie(
  token: string,
  cookie: CookieIO = liveCookieIO(),
): void {
  cookie.setCookie(TOKEN_COOKIE_NAME, token, { ...COOKIE_OPTIONS });
}

/**
 * Clear the session token Cookie. Uses `Max-Age=0` to signal expiry.
 */
export function clearSessionCookie(cookie: CookieIO = liveCookieIO()): void {
  cookie.deleteCookie(TOKEN_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Read the session Cookie and strip exactly ONE leading `Bearer ` prefix.
 *
 * Returns `null` when the Cookie is missing or empty. The Cookie value
 * is preserved as-is when there is no Bearer prefix — the JWT may be
 * stored in either format and downstream code re-wraps it.
 */
export function parseSessionCookie(
  cookie: CookieIO = liveCookieIO(),
): string | null {
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
export function authorizeFromCookie(
  cookie: CookieIO = liveCookieIO(),
): string | null {
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
export function buildAuthorizationHeader(
  cookie: CookieIO = liveCookieIO(),
): string | null {
  return authorizeFromCookie(cookie);
}
