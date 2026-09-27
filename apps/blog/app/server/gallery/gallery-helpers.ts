import { resolveBackendApiUrl } from '@blog/server/env';
import {
  getJson,
  type BackendEnv,
  type FetchLike,
} from '@blog/server/transport';

import {
  GalleryDetailSchema,
  GalleryListSchema,
  GetGalleryDetailInputSchema,
  GetGalleryListInputSchema,
  type GalleryDetail,
  type GalleryList,
  type GetGalleryDetailInput,
  type GetGalleryListInput,
} from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

export async function fetchGalleryList(
  input: GetGalleryListInput | undefined,
  options: FetchOptions = {},
): Promise<GalleryList> {
  const params = GetGalleryListInputSchema.parse(input ?? {});
  return getJson<GalleryList>({
    path: '/blog/gallery',
    query: { page: params.page, pageSize: params.pageSize },
    dataSchema: GalleryListSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}

export async function fetchGalleryDetail(
  input: GetGalleryDetailInput,
  options: FetchOptions = {},
): Promise<GalleryDetail> {
  const params = GetGalleryDetailInputSchema.parse(input);
  return getJson<GalleryDetail>({
    path: `/blog/gallery/${params.id}`,
    dataSchema: GalleryDetailSchema,
    env: options.env ?? defaultEnv,
    fetch: options.fetch,
  });
}
