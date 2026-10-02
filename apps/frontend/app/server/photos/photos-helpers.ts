import { z } from 'zod';

import type { CookieIO } from '@cms/server/cookies';
import { resolveBackendApiUrl } from '@cms/server/env';
import {
  getAuthorizedJson,
  postAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

import {
  CreateAlbumPhotoInputSchema,
  CreatePhotoInputSchema,
  DeletePhotoInputSchema,
  GetPhotoInputSchema,
  GetPhotosInputSchema,
  PaginatedPhotosSchema,
  PhotoSchema,
  UpdateAlbumPhotoInputSchema,
  UpdatePhotoInputSchema,
  type CreateAlbumPhotoInput,
  type CreatePhotoInput,
  type DeletePhotoInput,
  type GetPhotoInput,
  type GetPhotosInput,
  type PaginatedPhotos,
  type Photo,
  type UpdateAlbumPhotoInput,
  type UpdatePhotoInput,
} from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

// Void success envelope (data: null) — backend delete route omits the
// `data` field entirely.
const voidDataSchema = z.unknown();

export async function fetchPhotos(
  input: GetPhotosInput | undefined,
  options: FetchOptions = {},
): Promise<PaginatedPhotos> {
  const params = GetPhotosInputSchema.parse(input ?? {});
  return getAuthorizedJson<PaginatedPhotos>({
    path: '/cms/photos',
    query: {
      albumId: params.albumId,
      page: params.page,
      pageSize: params.pageSize,
    },
    dataSchema: PaginatedPhotosSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

export async function fetchEmptyAlbumPhotos(
  options: FetchOptions = {},
): Promise<Photo[]> {
  return getAuthorizedJson<Photo[]>({
    path: '/cms/photos/empty-album',
    dataSchema: z.array(PhotoSchema),
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

export async function fetchPhoto(
  input: GetPhotoInput,
  options: FetchOptions = {},
): Promise<Photo> {
  const params = GetPhotoInputSchema.parse(input);
  return getAuthorizedJson<Photo>({
    path: '/cms/photos/detail',
    query: { id: params.id },
    dataSchema: PhotoSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

export async function createPhoto(
  input: CreatePhotoInput,
  options: FetchOptions = {},
): Promise<Photo> {
  const params = CreatePhotoInputSchema.parse(input);
  return postAuthorizedJson<Photo>({
    path: '/cms/photos/create',
    body: {
      name: params.name,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoSchema,
  });
}

export async function createAlbumPhoto(
  input: CreateAlbumPhotoInput,
  options: FetchOptions = {},
): Promise<Photo> {
  const params = CreateAlbumPhotoInputSchema.parse(input);
  return postAuthorizedJson<Photo>({
    path: '/cms/photos/create/with-album',
    body: {
      albumId: params.albumId,
      name: params.name,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoSchema,
  });
}

/**
 * Mirrors the legacy `updatePhoto` body shape: only the `id` is
 * required; everything else is forwarded only when defined so an
 * explicit patch is never silently dropped. Note the legacy client
 * sent `isCover` on this endpoint even though the backend's
 * `UpdatePhotoDtoSchema` does not accept it; we preserve that for
 * backwards compatibility and let any extra-field rejection happen
 * upstream if a backend tightening lands in the future.
 */
export async function updatePhoto(
  input: UpdatePhotoInput,
  options: FetchOptions = {},
): Promise<Photo> {
  const params = UpdatePhotoInputSchema.parse(input);
  return postAuthorizedJson<Photo>({
    path: '/cms/photos/update',
    body: {
      id: params.id,
      name: params.name,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
      albumId: params.albumId,
      isCover: params.isCover,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoSchema,
  });
}

export async function updateAlbumPhoto(
  input: UpdateAlbumPhotoInput,
  options: FetchOptions = {},
): Promise<Photo> {
  const params = UpdateAlbumPhotoInputSchema.parse(input);
  return postAuthorizedJson<Photo>({
    path: '/cms/photos/update/with-album',
    body: {
      id: params.id,
      albumId: params.albumId,
      name: params.name,
      isCover: params.isCover,
      url: params.url,
      thumbnailUrl: params.thumbnailUrl,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoSchema,
  });
}

export async function deletePhoto(
  input: DeletePhotoInput,
  options: FetchOptions = {},
): Promise<void> {
  const params = DeletePhotoInputSchema.parse(input);
  await postAuthorizedJson<unknown>({
    path: '/cms/photos/delete',
    body: { id: params.id },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}
