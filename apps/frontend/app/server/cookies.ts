/*
 * Cookie / session contract: HttpOnly, SameSite=Strict (per `CONTEXT.md`),
 * and a `Bearer <jwt>` value — the backend whitelist also accepts a raw token.
 *
 * The helpers are pure over a `CookieIO` interface so they are testable
 * without a live request context. `liveCookieIO` reaches the real
 * implementation through `createIsomorphicFn` plus a dynamic import, so this
 * module keeps no static server-only specifier for the client bundle to
 * resolve. A `.server.`-suffixed file cannot do the same job: TanStack import
 * protection evaluates at resolve time, so a statically server-only module
 * cannot be shared by a client-reachable one.
 */

import { createIsomorphicFn } from '@tanstack/react-start';

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
    // Throwing rather than returning a no-op keeps a client-side call
    // from silently looking like "no session" and redirecting instead of
    // surfacing the mistake.
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
 * Accepts either a raw token (`abc.def.ghi`) or a Bearer-prefixed value
 * (`Bearer abc.def.ghi`). The caller is responsible for the format — the
 * helper never re-wraps.
 */
export function setSessionCookie(token: string, cookie: CookieIO): void {
  cookie.setCookie(TOKEN_COOKIE_NAME, token, { ...COOKIE_OPTIONS });
}

/** Uses `Max-Age=0` to signal expiry. */
export function clearSessionCookie(cookie: CookieIO): void {
  cookie.deleteCookie(TOKEN_COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });
}

/**
 * Strips exactly ONE leading `Bearer ` prefix. Returns `null` when the
 * Cookie is missing or empty. The Cookie value is preserved as-is when
 * there is no Bearer prefix — the JWT may be stored in either format and
 * downstream code re-wraps it.
 */
export function parseSessionCookie(cookie: CookieIO): string | null {
  const raw = cookie.getCookie(TOKEN_COOKIE_NAME);
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice('Bearer '.length) : raw;
}

/**
 * Resolve the Cookie into a Bearer-prefixed string suitable for an
 * outbound `Authorization` header. Returns `null` when there is no
 * session — rejecting the request is the caller's job.
 */
export function authorizeFromCookie(cookie: CookieIO): string | null {
  const raw = cookie.getCookie(TOKEN_COOKIE_NAME);
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`;
}
