/**
 * TanStack Start server-function boundary for auth operations.
 *
 * Phase 2a compatibility shim: consumes the shared `app/server` helpers
 * (transport, env, cookies, errors, result) so domain code paths share a
 * single Fastify-envelope contract. The public surface — `login` and
 * `logout` server functions — is unchanged so existing feature code keeps
 * importing from `@cms/server/auth`.
 *
 * Behavior preserved from Phase 1:
 *   - POST directly to the backend `/auth/login` and `/auth/logout`
 *     endpoints. No `/api/bff/*` is touched.
 *   - Manage the HttpOnly `token` Cookie (name `token`, value
 *     `Bearer <jwt>`).
 *   - Single JWT, never auto-refreshed.
 */

import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';

import {
  clearSessionCookie,
  liveCookieIO,
  parseSessionCookie,
  setSessionCookie,
} from '@cms/server/cookies';
import { envelopeToApiError, type ApiError } from '@cms/server/errors';
import { resolveBackendApiUrl } from '@cms/server/env';
import { ResponseValidationError, envelopeSchema } from '@cms/server/result';
import { postAuthorizedJson, postJson } from '@cms/server/transport';

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof LoginInputSchema>;

// ---------------------------------------------------------------------------
// Backend response schemas (per-operation contracts).
// ---------------------------------------------------------------------------

const LoginDataSchema = z.object({
  accessToken: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Server function: login
// ---------------------------------------------------------------------------

export const login = createServerFn({ method: 'POST' })
  .validator((data: unknown): LoginInput => LoginInputSchema.parse(data))
  .handler(async ({ data }) => {
    try {
      const result = await postJson({
        path: '/auth/login',
        body: { username: data.username, password: data.password },
        env: { resolveBaseUrl: resolveBackendApiUrl },
        dataSchema: LoginDataSchema,
      });
      setSessionCookie(`Bearer ${result.accessToken}`, await liveCookieIO());
      return { code: '0000', message: '登录成功' };
    } catch (error) {
      // Convert any envelope-level ResponseValidationError to a typed
      // ApiError so the public login surface keeps the existing
      // `ApiError`-shaped failure vocabulary.
      if (error instanceof ResponseValidationError) {
        const apiError: ApiError = envelopeToApiError({
          code: 'ERR0006',
          message: error.message,
        }) ?? { _tag: 'UnknownError', message: error.message };
        throw apiError;
      }
      throw error;
    }
  });

// ---------------------------------------------------------------------------
// Server function: logout
// ---------------------------------------------------------------------------

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  // Best-effort backend logout — failures must not block Cookie clearing.
  // We deliberately swallow errors here to preserve the Phase 1 contract:
  // the local Cookie is always cleared, even if the backend is down.
  const cookie = await liveCookieIO();
  const token = parseSessionCookie(cookie);

  if (token) {
    await postAuthorizedJson({
      path: '/auth/logout',
      body: {},
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }).catch(() => undefined);
  }

  clearSessionCookie(cookie);
  return { code: '0000', message: '已登出' };
});
