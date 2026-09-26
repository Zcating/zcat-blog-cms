/**
 * TanStack Start server-function lane for the photo-albums domain.
 *
 * Migrates the legacy `AlbumsApi` operation surface onto the Phase-2a
 * shared server boundary:
 *
 *   - getPhotoAlbums        — GET    /cms/photo-albums?page=&pageSize=  (protected)
 *   - getPhotoAlbum         — GET    /cms/photo-albums/:id              (protected)
 *   - createPhotoAlbum      — POST   /cms/photo-albums                  (protected)
 *   - updatePhotoAlbum      — POST   /cms/photo-albums/update           (protected)
 *   - deletePhotoAlbum      — POST   /cms/photo-albums/delete           (protected)
 *   - setPhotoAlbumCover    — POST   /cms/photo-albums/cover            (protected)
 *   - addPhotos             — POST   /cms/photo-albums/add-photos       (protected)
 *
 * Server functions are thin shells over the pure helpers in
 * `./albums-helpers.ts`. Each protected function composes the shared
 * `createProtectedFunctionMiddleware`. Endpoint paths, payload shapes,
 * and the ResultCode -> ApiErrorTag mapping are preserved from the
 * legacy `AlbumsApi` client interface.
 *
 * Stable `queryOptions` factories are exported for Phase 3 consumers
 * (loaders, route components). They reference the server functions by
 * identity so the cache key stays in sync with the RPC.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import { resolveBackendApiUrl } from '@cms/server/env';

import {
  addPhotos as addPhotosHelper,
  createPhotoAlbum as createPhotoAlbumHelper,
  deletePhotoAlbum as deletePhotoAlbumHelper,
  fetchPhotoAlbum as fetchPhotoAlbumHelper,
  fetchPhotoAlbums as fetchPhotoAlbumsHelper,
  setPhotoAlbumCover as setPhotoAlbumCoverHelper,
  updatePhotoAlbum as updatePhotoAlbumHelper,
} from './albums-helpers';
import {
  AddPhotosInputSchema,
  CreatePhotoAlbumInputSchema,
  DeletePhotoAlbumInputSchema,
  GetPhotoAlbumInputSchema,
  GetPhotoAlbumsInputSchema,
  SetPhotoAlbumCoverInputSchema,
  UpdatePhotoAlbumInputSchema,
  type AddPhotosInput,
  type CreatePhotoAlbumInput,
  type DeletePhotoAlbumInput,
  type GetPhotoAlbumInput,
  type GetPhotoAlbumsInput,
  type SetPhotoAlbumCoverInput,
  type UpdatePhotoAlbumInput,
} from './schemas';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const protectedMiddleware = createProtectedFunctionMiddleware();

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const getPhotoAlbums = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetPhotoAlbumsInput =>
      GetPhotoAlbumsInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) =>
    fetchPhotoAlbumsHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const getPhotoAlbum = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetPhotoAlbumInput => GetPhotoAlbumInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    fetchPhotoAlbumHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const createPhotoAlbum = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): CreatePhotoAlbumInput =>
      CreatePhotoAlbumInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    createPhotoAlbumHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const updatePhotoAlbum = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdatePhotoAlbumInput =>
      UpdatePhotoAlbumInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    updatePhotoAlbumHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const deletePhotoAlbum = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): DeletePhotoAlbumInput =>
      DeletePhotoAlbumInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    deletePhotoAlbumHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const setPhotoAlbumCover = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): SetPhotoAlbumCoverInput =>
      SetPhotoAlbumCoverInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    setPhotoAlbumCoverHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const addPhotos = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): AddPhotosInput => AddPhotosInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    addPhotosHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

// ---------------------------------------------------------------------------
// Stable queryOptions factories
// ---------------------------------------------------------------------------

/**
 * `queryOptions` for the paginated album list. Keyed by the
 * `(page, pageSize)` tuple so each page has its own cache slot.
 */
export function photoAlbumsListQueryOptions(
  input: Partial<GetPhotoAlbumsInput> = {},
) {
  const resolved: GetPhotoAlbumsInput = GetPhotoAlbumsInputSchema.parse(input);
  return queryOptions({
    queryKey: ['albums', 'list', resolved] as const,
    queryFn: () => getPhotoAlbums({ data: resolved }),
  });
}

/**
 * `queryOptions` for the album detail read. Keyed by id.
 */
export function photoAlbumDetailQueryOptions(input: GetPhotoAlbumInput) {
  return queryOptions({
    queryKey: ['albums', 'detail', input.id] as const,
    queryFn: () => getPhotoAlbum({ data: input }),
  });
}

/**
 * `queryOptions` for the album "cover" sidebar / hero view. Shares the
 * same backing data shape as the detail query but uses a distinct key
 * so consumers can scope cache lifecycles independently (e.g. refresh
 * cover on `setPhotoAlbumCover` without invalidating detail screens).
 */
export function photoAlbumCoverQueryOptions(input: GetPhotoAlbumInput) {
  return queryOptions({
    queryKey: ['albums', 'cover', input.id] as const,
    queryFn: () => getPhotoAlbum({ data: input }),
  });
}
