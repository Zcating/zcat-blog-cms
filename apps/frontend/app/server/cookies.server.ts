/**
 * Server-only Cookie primitives.
 *
 * This file is the single place that touches the
 * `@tanstack/react-start/server` API for Cookie reads/writes. It
 * exists so `cookies.ts` can re-export the pure helpers without
 * pulling a server-only import into the client bundle.
 *
 * The `.server.ts` suffix combined with the explicit
 * `import '@tanstack/react-start/server-only'` marker at the top of
 * the file opts the module into TanStack Start's import-protection
 * �?the bundler refuses to ship this file to the client.
 *
 * The `liveCookieIO` factory is exported as the default
 * implementation that domain code resolves per-request via
 * `cookies.ts`.
 */

import '@tanstack/react-start/server-only';

import {
  deleteCookie as startDeleteCookie,
  getCookie as startGetCookie,
  setCookie as startSetCookie,
} from '@tanstack/react-start/server';

import type { CookieIO } from './cookies';

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
