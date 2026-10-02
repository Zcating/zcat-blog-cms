// `contact` is a JSON string on the wire and MUST be parsed at the
// boundary; the write path sends it back as an object because the
// backend serialises it itself.
import { z } from 'zod';

import type { CookieIO } from '@cms/server/cookies';
import {
  getAuthorizedJson,
  postAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

/**
 * `contact` arrives from the backend as a JSON string. We accept both
 * the wire form (string) and a pre-parsed object so the helper stays
 * resilient if a mock or future deployment sends the object form
 * directly. The downstream typed shape is always an object.
 */
const ContactWireSchema = z.union([
  z.string().transform((value, ctx) => {
    try {
      const parsed = JSON.parse(value) as unknown;
      const result = z
        .object({ email: z.string(), github: z.string() })
        .safeParse(parsed);
      if (!result.success) {
        ctx.addIssue({
          code: 'custom',
          message: 'contact JSON did not match { email, github }',
        });
        return z.NEVER;
      }
      return result.data;
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'contact was not a valid JSON string',
      });
      return z.NEVER;
    }
  }),
  z.object({ email: z.string(), github: z.string() }),
]);

const UserInfoDataSchema = z.object({
  name: z.string(),
  contact: ContactWireSchema,
  occupation: z.string(),
  avatar: z.string(),
  aboutMe: z.string(),
  abstract: z.string(),
});

export interface UserInfo {
  name: string;
  contact: { email: string; github: string };
  occupation: string;
  avatar: string;
  aboutMe: string;
  abstract: string;
}

const UpdateUserInfoBodySchema = z.object({
  name: z.string().min(1),
  contact: z.object({
    email: z.string(),
    github: z.string(),
  }),
  // The legacy client typed the write as `Partial<UserInfo>`, so we keep
  // these fields optional at the wire boundary even though the backend's
  // UserInfoSchema currently requires all of them. The backend validator
  // will reject an incomplete body with ERR0005; the helper just
  // preserves the legacy shape contract.
  occupation: z.string().optional(),
  avatar: z.string().optional(),
  aboutMe: z.string().optional(),
  abstract: z.string().optional(),
});

export type UpdateUserInfoBody = z.infer<typeof UpdateUserInfoBodySchema>;
export { UpdateUserInfoBodySchema };

const SessionValidityDataSchema = z.object({
  valid: z.boolean(),
});

interface FetchOptions {
  env: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

export async function fetchCurrentUser(
  options: FetchOptions,
): Promise<UserInfo> {
  return getAuthorizedJson<UserInfo>({
    path: '/cms/user-info',
    env: options.env,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: UserInfoDataSchema,
  });
}

export interface UpdateCurrentUserOptions extends FetchOptions {
  body: UpdateUserInfoBody;
}

export async function updateCurrentUser(
  options: UpdateCurrentUserOptions,
): Promise<UserInfo> {
  // Validator runs at the function boundary in the server function, but
  // we re-validate defensively so direct helper callers cannot bypass
  // the contract.
  const parsedBody = UpdateUserInfoBodySchema.parse(options.body);

  return postAuthorizedJson<UserInfo>({
    path: '/cms/user-info/update',
    env: options.env,
    cookie: options.cookie,
    fetch: options.fetch,
    body: parsedBody,
    dataSchema: UserInfoDataSchema,
  });
}

export async function fetchSessionValidity(
  options: FetchOptions,
): Promise<boolean> {
  const data = await postAuthorizedJson<{ valid: boolean }>({
    path: '/auth/is-valid',
    env: options.env,
    cookie: options.cookie,
    fetch: options.fetch,
    body: {},
    dataSchema: SessionValidityDataSchema,
  });
  return data.valid;
}
