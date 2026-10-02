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
  AddPhotosInputSchema,
  CreatePhotoAlbumInputSchema,
  GetPhotoAlbumInputSchema,
  GetPhotoAlbumsInputSchema,
  PaginatedPhotoAlbumsSchema,
  PhotoAlbumDetailSchema,
  PhotoAlbumSchema,
  SetPhotoAlbumCoverInputSchema,
  UpdatePhotoAlbumInputSchema,
  type AddPhotosInput,
  type CreatePhotoAlbumInput,
  type GetPhotoAlbumInput,
  type GetPhotoAlbumsInput,
  type PaginatedPhotoAlbums,
  type PhotoAlbum,
  type PhotoAlbumDetail,
  type SetPhotoAlbumCoverInput,
  type UpdatePhotoAlbumInput,
} from './schemas';

export interface FetchOptions {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

// Void success envelope (data: null) — backend delete / cover /
// add-photos routes omit the `data` field entirely. `z.unknown()`
// accepts any data slot including `null` and `undefined`.
const voidDataSchema = z.unknown();

export async function fetchPhotoAlbums(
  input: GetPhotoAlbumsInput | undefined,
  options: FetchOptions = {},
): Promise<PaginatedPhotoAlbums> {
  const params = GetPhotoAlbumsInputSchema.parse(input ?? {});
  return getAuthorizedJson<PaginatedPhotoAlbums>({
    path: '/cms/photo-albums',
    query: { page: params.page, pageSize: params.pageSize },
    dataSchema: PaginatedPhotoAlbumsSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

export async function fetchPhotoAlbum(
  input: GetPhotoAlbumInput,
  options: FetchOptions = {},
): Promise<PhotoAlbumDetail> {
  const params = GetPhotoAlbumInputSchema.parse(input);
  return getAuthorizedJson<PhotoAlbumDetail>({
    path: `/cms/photo-albums/${params.id}`,
    dataSchema: PhotoAlbumDetailSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

export async function createPhotoAlbum(
  input: CreatePhotoAlbumInput,
  options: FetchOptions = {},
): Promise<PhotoAlbum> {
  const params = CreatePhotoAlbumInputSchema.parse(input);
  return postAuthorizedJson<PhotoAlbum>({
    path: '/cms/photo-albums',
    body: {
      name: params.name,
      description: params.description,
      available: params.available,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoAlbumSchema,
  });
}

/**
 * Mirrors the legacy `updatePhotoAlbum` body shape exactly: all four
 * fields are forwarded with `undefined` for the omitted ones so an
 * explicit empty-string / `false` patch is never silently dropped by
 * the backend's `UpdateAlbumDtoSchema` `optional()` chain.
 */
export async function updatePhotoAlbum(
  input: UpdatePhotoAlbumInput,
  options: FetchOptions = {},
): Promise<PhotoAlbum> {
  const params = UpdatePhotoAlbumInputSchema.parse(input);
  return postAuthorizedJson<PhotoAlbum>({
    path: '/cms/photo-albums/update',
    body: {
      id: params.id,
      name: params.name,
      description: params.description,
      available: params.available,
    },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: PhotoAlbumSchema,
  });
}

/**
 * The backend `zValidator('json', z.object({ id: z.string() }))` accepts
 * a string, so the legacy `{ id: String(id) }` body shape is preserved.
 */
export async function deletePhotoAlbum(
  input: { id: number },
  options: FetchOptions = {},
): Promise<void> {
  await postAuthorizedJson<unknown>({
    path: '/cms/photo-albums/delete',
    body: { id: String(input.id) },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}

export async function setPhotoAlbumCover(
  input: SetPhotoAlbumCoverInput,
  options: FetchOptions = {},
): Promise<void> {
  const params = SetPhotoAlbumCoverInputSchema.parse(input);
  await postAuthorizedJson<unknown>({
    path: '/cms/photo-albums/cover',
    body: { albumId: params.albumId, photoId: params.photoId },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}

export async function addPhotos(
  input: AddPhotosInput,
  options: FetchOptions = {},
): Promise<void> {
  const params = AddPhotosInputSchema.parse(input);
  await postAuthorizedJson<unknown>({
    path: '/cms/photo-albums/add-photos',
    body: { albumId: params.albumId, photoIds: params.photoIds },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}
