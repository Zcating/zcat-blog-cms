/*
 * User/session operation surface:
 *   - `getCurrentUser`     — GET  /cms/user-info      (protected)
 *   - `updateCurrentUser`  — POST /cms/user-info/update (protected)
 *   - `isValid`            — POST /auth/is-valid      (public auth/session check)
 *
 * The server functions are thin shells over the pure helpers in
 * `./users-helpers.ts`. Each protected function composes the shared
 * `createProtectedFunctionMiddleware`. The session validity check is a
 * public operation but is still explicit and typed — it forwards the
 * Cookie Bearer so the backend can identify the session being checked.
 *
 * Stable `queryOptions` factories are exported for loaders and route
 * components. They reference the server functions by identity so the
 * cache key stays in sync with the RPC.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import { liveCookieIO } from '@cms/server/cookies';
import { resolveBackendApiUrl } from '@cms/server/env';

import {
  fetchCurrentUser as callFetchCurrentUser,
  fetchSessionValidity as callFetchSessionValidity,
  updateCurrentUser as callUpdateCurrentUser,
  UpdateUserInfoBodySchema,
  type UpdateUserInfoBody,
  type UserInfo,
} from './users-helpers';

/**
 * Single protected-function middleware instance shared by every private
 * operation in this domain. The factory is called at module scope so
 * the resulting middleware is referentially stable across imports.
 */
const protectedMiddleware = createProtectedFunctionMiddleware();

export const getCurrentUser = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async () =>
    callFetchCurrentUser({
      env: { resolveBaseUrl: resolveBackendApiUrl },
      cookie: await liveCookieIO(),
    }),
  );

export const updateCurrentUser = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdateUserInfoBody => UpdateUserInfoBodySchema.parse(data),
  )
  .handler(async ({ data }) =>
    callUpdateCurrentUser({
      env: { resolveBaseUrl: resolveBackendApiUrl },
      cookie: await liveCookieIO(),
      body: data,
    }),
  );

/**
 * Public session-validity check. The function is NOT protected (the
 * backend's `/auth/is-valid` accepts both authenticated and anonymous
 * callers and reports `valid: false` for the latter). It is still
 * explicit and typed so feature code never falls back to a generic
 * `HttpClient.post` call.
 */
export const isValid = createServerFn({ method: 'POST' }).handler(async () =>
  callFetchSessionValidity({
    env: { resolveBaseUrl: resolveBackendApiUrl },
    cookie: await liveCookieIO(),
  }),
);

/**
 * Object identity is stable across calls so consumers can place it in
 * module-scope consts and feed it to `useQuery` /
 * `queryClient.prefetchQuery` directly.
 */
const _userInfoQueryOptions = queryOptions<UserInfo>({
  queryKey: ['users', 'current'],
  queryFn: () => getCurrentUser(),
});

export function userInfoQueryOptions() {
  return _userInfoQueryOptions;
}

/**
 * `queryOptions` for the session validity check. Lives at a distinct
 * key so the user-info cache and the session-validity cache can
 * invalidate independently (e.g. on logout the validity query must
 * refetch; the user-info query can be removed outright).
 */
const _isValidQueryOptions = queryOptions<boolean>({
  queryKey: ['users', 'session', 'validity'],
  queryFn: () => isValid(),
});

export function isValidQueryOptions() {
  return _isValidQueryOptions;
}
