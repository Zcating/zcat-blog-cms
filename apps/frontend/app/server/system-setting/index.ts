/**
 * TanStack Start server-function lane for the system-setting domain.
 *
 * Migrates the legacy `SystemSettingApi.getUploadUrl(key)` (which used to
 * ride the `/api/bff/cms/system-setting/upload-config` proxy) onto the
 * Phase-2a shared server boundary. The new operation:
 *
 *   - Reads `BACKEND_API_URL` per request via the shared
 *     `resolveBackendApiUrl` (no `VITE_*` fallback, no `/api/bff/*`).
 *   - Forwards the request's Cookie Bearer as `Authorization` from the
 *     shared `authorizeFromCookie` helper when a session is present.
 *     The upload-config endpoint is accessible to an authenticated
 *     user; we forward whatever the request Cookie carries and never
 *     leak it across requests.
 *   - Parses the backend envelope through the shared `parseEnvelope`
 *     and validates the unwrapped `data` against the per-operation
 *     Zod schema. A schema mismatch throws a typed
 *     `ResponseValidationError`; a non-success envelope throws a typed
 *     `ApiError`.
 *   - Has no automatic retries. The `fetch` boundary is called exactly
 *     once per operation.
 *
 * The export surface for Phase 3:
 *   - `getSystemSettingUploadUrlServerFn` — `createServerFn({ method: 'GET' })`
 *     wrapper guarded by the protected-function middleware.
 *   - `systemSettingUploadUrlOptions` — stable `queryOptions` factory
 *     keyed off the operation + `key`, so consumers can subscribe to a
 *     presigned URL keyed by object key without knowing the wire
 *     details.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import type { CookieIO } from '@cms/server/cookies';
import { resolveBackendApiUrl } from '@cms/server/env';
import {
  getAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

// ---------------------------------------------------------------------------
// Input + response schemas
// ---------------------------------------------------------------------------

const GetUploadUrlInputSchema = z.object({
  key: z.string().min(1),
});

const UploadConfigResultSchema = z.object({
  presignedUrl: z.string(),
});

// ---------------------------------------------------------------------------
// QueryFn factories
// ---------------------------------------------------------------------------

interface UploadUrlQueryFnDeps {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

interface UploadUrlQueryFnInput {
  key: string;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export function systemSettingUploadUrlQueryFn({
  key,
  ...deps
}: UploadUrlQueryFnInput & UploadUrlQueryFnDeps): Promise<
  z.infer<typeof UploadConfigResultSchema>
> {
  // Build the query path the same way the legacy `createQueryPath` did:
  // append `?key=<urlencoded>` so backend validators match. The shared
  // `getAuthorizedJson` URL-encodes the query map via `encodeURIComponent`,
  // so passing `{ key }` produces the same wire form.
  return getAuthorizedJson<z.infer<typeof UploadConfigResultSchema>>({
    path: '/cms/system-setting/upload-config',
    query: { key },
    dataSchema: UploadConfigResultSchema,
    env: deps.env ?? defaultEnv,
    cookie: deps.cookie,
    fetch: deps.fetch,
  });
}

// ---------------------------------------------------------------------------
// queryOptions factory
// ---------------------------------------------------------------------------

export function systemSettingUploadUrlOptions(key: string) {
  return queryOptions({
    queryKey: ['system-setting', 'upload-url', key] as const,
    queryFn: () => systemSettingUploadUrlQueryFn({ key }),
  });
}

// ---------------------------------------------------------------------------
// Protected server function
// ---------------------------------------------------------------------------

const protectedMiddleware = createProtectedFunctionMiddleware();

export const getSystemSettingUploadUrlServerFn = createServerFn({
  method: 'GET',
})
  .middleware([protectedMiddleware])
  .validator((data: unknown) => GetUploadUrlInputSchema.parse(data))
  .handler(async ({ data }) => {
    return systemSettingUploadUrlQueryFn({ key: data.key });
  });

// ---------------------------------------------------------------------------
// Re-exports for Phase 3 (type-only)
// ---------------------------------------------------------------------------

export type GetUploadUrlInput = z.infer<typeof GetUploadUrlInputSchema>;
export type UploadConfigResult = z.infer<typeof UploadConfigResultSchema>;
