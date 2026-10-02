/*
 * User/session operation surface. The server functions are thin shells over
 * the pure helpers in `./users-helpers.ts`, and every private one composes
 * the shared `createProtectedFunctionMiddleware`.
 *
 * `isValid` is deliberately NOT protected: the backend's `/auth/is-valid`
 * accepts anonymous callers and answers `valid: false` for them.
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

export const isValid = createServerFn({ method: 'POST' }).handler(async () =>
  callFetchSessionValidity({
    env: { resolveBaseUrl: resolveBackendApiUrl },
    cookie: await liveCookieIO(),
  }),
);

const _userInfoQueryOptions = queryOptions<UserInfo>({
  queryKey: ['users', 'current'],
  queryFn: () => getCurrentUser(),
});

export function userInfoQueryOptions() {
  return _userInfoQueryOptions;
}

/**
 * A distinct key from `userInfoQueryOptions`, so on logout the validity
 * query can refetch while the user-info query is removed outright.
 */
const _isValidQueryOptions = queryOptions<boolean>({
  queryKey: ['users', 'session', 'validity'],
  queryFn: () => isValid(),
});

export function isValidQueryOptions() {
  return _isValidQueryOptions;
}
