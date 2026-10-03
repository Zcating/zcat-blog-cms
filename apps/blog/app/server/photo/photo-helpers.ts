import { resolveBackendApiUrl } from '@blog/server/env';
import {
  getJson,
  type BackendEnv,
  type FetchLike,
} from '@blog/server/transport';

import {
  GetPhotoListInputSchema,
  PhotoListSchema,
  type GetPhotoListInput,
  type PhotoList,
} from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export async function fetchPhotoList(
  input: GetPhotoListInput | undefined,
  options: FetchOptions = {},
): Promise<PhotoList> {
  const params = GetPhotoListInputSchema.parse(input ?? {});
  return getJson<PhotoList>({
    path: '/blog/photo/list',
    query: { page: params.page, pageSize: params.pageSize },
    dataSchema: PhotoListSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}
