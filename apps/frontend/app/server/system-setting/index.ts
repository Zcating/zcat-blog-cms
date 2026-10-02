// Every operation goes through the shared `transport` helpers, so the
// base-URL, Authorization, envelope-parsing and no-retry rules in
// `./transport.ts` apply here unchanged.
//
// `getSystemSettingUploadUrlServerFn` is the only read path: every consumer
// calls it, so a query factory here would reach `liveCookieIO` in the
// browser, where it throws.

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

const GetUploadUrlInputSchema = z.object({
  key: z.string().min(1),
});

const UploadConfigResultSchema = z.object({
  presignedUrl: z.string(),
});

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
  // The shared
  // `getAuthorizedJson` URL-encodes the query map via `encodeURIComponent`,
  // so passing `{ key }` produces the `?key=<urlencoded>` form the backend
  // validators expect.
  return getAuthorizedJson<z.infer<typeof UploadConfigResultSchema>>({
    path: '/cms/system-setting/upload-config',
    query: { key },
    dataSchema: UploadConfigResultSchema,
    env: deps.env ?? defaultEnv,
    cookie: deps.cookie,
    fetch: deps.fetch,
  });
}

const protectedMiddleware = createProtectedFunctionMiddleware();

export const getSystemSettingUploadUrlServerFn = createServerFn({
  method: 'GET',
})
  .middleware([protectedMiddleware])
  .validator((data: unknown) => GetUploadUrlInputSchema.parse(data))
  .handler(async ({ data }) => {
    return systemSettingUploadUrlQueryFn({ key: data.key });
  });

export type GetUploadUrlInput = z.infer<typeof GetUploadUrlInputSchema>;
export type UploadConfigResult = z.infer<typeof UploadConfigResultSchema>;
