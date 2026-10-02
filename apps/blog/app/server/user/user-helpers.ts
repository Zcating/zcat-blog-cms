import { resolveBackendApiUrl } from '@blog/server/env';
import {
  getJson,
  type BackendEnv,
  type FetchLike,
} from '@blog/server/transport';

import { UserInfoSchema, type UserInfo } from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export async function fetchUserInfo(
  options: FetchOptions = {},
): Promise<UserInfo> {
  return getJson<UserInfo>({
    path: '/blog/user-info',
    dataSchema: UserInfoSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}
