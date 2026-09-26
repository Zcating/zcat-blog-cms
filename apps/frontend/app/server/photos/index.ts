/*
 * Photos operation surface:
 *
 *   - getPhotos              — GET    /cms/photos?albumId=&page=&pageSize=  (protected)
 *   - getEmptyAlbumPhotos    — GET    /cms/photos/empty-album               (protected)
 *   - getPhoto               — GET    /cms/photos/detail?id=                 (protected)
 *   - createPhoto            — POST   /cms/photos/create                     (protected)
 *   - createAlbumPhoto       — POST   /cms/photos/create/with-album          (protected)
 *   - updatePhoto            — POST   /cms/photos/update                     (protected)
 *   - updateAlbumPhoto       — POST   /cms/photos/update/with-album          (protected)
 *   - deletePhoto            — POST   /cms/photos/delete                     (protected)
 *
 * Server functions are thin shells over the pure helpers in
 * `./photos-helpers.ts`. Each protected function composes the shared
 * `createProtectedFunctionMiddleware`.
 *
 * Stable `queryOptions` factories are exported for loaders and route
 * components. They reference the server functions by identity so the
 * cache key stays in sync with the RPC.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import { resolveBackendApiUrl } from '@cms/server/env';

import {
  createAlbumPhoto as createAlbumPhotoHelper,
  createPhoto as createPhotoHelper,
  deletePhoto as deletePhotoHelper,
  fetchEmptyAlbumPhotos as fetchEmptyAlbumPhotosHelper,
  fetchPhoto as fetchPhotoHelper,
  fetchPhotos as fetchPhotosHelper,
  updateAlbumPhoto as updateAlbumPhotoHelper,
  updatePhoto as updatePhotoHelper,
} from './photos-helpers';
import {
  CreateAlbumPhotoInputSchema,
  CreatePhotoInputSchema,
  DeletePhotoInputSchema,
  GetPhotoInputSchema,
  GetPhotosInputSchema,
  UpdateAlbumPhotoInputSchema,
  UpdatePhotoInputSchema,
  type CreateAlbumPhotoInput,
  type CreatePhotoInput,
  type DeletePhotoInput,
  type GetPhotoInput,
  type GetPhotosInput,
  type UpdateAlbumPhotoInput,
  type UpdatePhotoInput,
} from './schemas';

const protectedMiddleware = createProtectedFunctionMiddleware();

export const getPhotos = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetPhotosInput => GetPhotosInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) =>
    fetchPhotosHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const getEmptyAlbumPhotos = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async () =>
    fetchEmptyAlbumPhotosHelper({
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const getPhoto = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator((data: unknown): GetPhotoInput => GetPhotoInputSchema.parse(data))
  .handler(async ({ data }) =>
    fetchPhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const createPhoto = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): CreatePhotoInput => CreatePhotoInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    createPhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const createAlbumPhoto = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): CreateAlbumPhotoInput =>
      CreateAlbumPhotoInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    createAlbumPhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const updatePhoto = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdatePhotoInput => UpdatePhotoInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    updatePhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const updateAlbumPhoto = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdateAlbumPhotoInput =>
      UpdateAlbumPhotoInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    updateAlbumPhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const deletePhoto = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): DeletePhotoInput => DeletePhotoInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    deletePhotoHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

/**
 * The query key encodes
 * the effective `albumId / page / pageSize` so each (album, page) has
 * its own cache slot — consumers can mutate one album without
 * invalidating sibling albums.
 */
export function photoListQueryOptions(input: Partial<GetPhotosInput> = {}) {
  const resolved: GetPhotosInput = GetPhotosInputSchema.parse(input);
  return queryOptions({
    queryKey: ['photos', 'list', resolved] as const,
    queryFn: () => getPhotos({ data: resolved }),
  });
}

/** Keyed by id. */
export function photoDetailQueryOptions(input: GetPhotoInput) {
  return queryOptions({
    queryKey: ['photos', 'detail', input.id] as const,
    queryFn: () => getPhoto({ data: input }),
  });
}

/**
 * Photos with no album
 * assignment. Shared across the album "select photo" modal so the
 * selector list stays cached across multiple opens in a session.
 */
export function emptyAlbumPhotosQueryOptions() {
  return queryOptions({
    queryKey: ['photos', 'empty-album'] as const,
    queryFn: () => getEmptyAlbumPhotos(),
  });
}
