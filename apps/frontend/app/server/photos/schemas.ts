/**
 * Zod schemas for the photos domain.
 *
 * The backend's `cms/photos` Hono routes accept and return the shapes
 * documented here. The Fastify-style `{ code, message, data }` envelope
 * is unwrapped by `parseEnvelope`; these schemas only describe the
 * payload that lives in `data`.
 *
 * Sources:
 *   - apps/backend/src/features/cms/photo/photo.schema.ts
 *   - apps/backend/src/features/cms/photo/photo.service.ts
 *   - apps/backend/src/features/cms/photo-album/photo-album.schema.ts
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Coercion helpers — mirror the backend `safeNumber` style so server
// function inputs match what Hono's `zValidator('query')` would produce.
// ---------------------------------------------------------------------------

const coercePage = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
});

const coercePageSize = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
});

const coerceAlbumId = z
  .union([z.number(), z.string()])
  .transform((value) => {
    if (typeof value === 'number') return value;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  })
  .optional();

/**
 * Boolean coercion for `isCover` mirrors the backend's
 * `z.preprocess` helper that accepts `"true"` / `"false"` strings.
 */
const coerceBoolean = z.preprocess((value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}, z.boolean());

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export const GetPhotosInputSchema = z.object({
  albumId: coerceAlbumId,
  page: coercePage.optional().default(1),
  pageSize: coercePageSize.optional().default(20),
});

export type GetPhotosInput = z.infer<typeof GetPhotosInputSchema>;

export const GetPhotoInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetPhotoInput = z.infer<typeof GetPhotoInputSchema>;

export const CreatePhotoInputSchema = z.object({
  name: z.string().min(1),
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1),
});

export type CreatePhotoInput = z.infer<typeof CreatePhotoInputSchema>;

export const CreateAlbumPhotoInputSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  url: z.string().min(1),
  thumbnailUrl: z.string().min(1),
});

export type CreateAlbumPhotoInput = z.infer<typeof CreateAlbumPhotoInputSchema>;

/**
 * Update payload mirrors the legacy `updatePhoto` call: all five fields
 * are independently optional so the caller can patch any one of them.
 */
export const UpdatePhotoInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  albumId: z.coerce.number().int().positive().optional(),
  isCover: z.boolean().optional(),
});

export type UpdatePhotoInput = z.infer<typeof UpdatePhotoInputSchema>;

/**
 * Backend `UpdateAlbumPhotoDtoSchema` requires `id`, `albumId`, `name`,
 * `isCover` (with `isCover` accepting `"true"` / `"false"` strings).
 * `url` and `thumbnailUrl` are optional patches for the upload metadata.
 */
export const UpdateAlbumPhotoInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  albumId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  isCover: coerceBoolean,
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export type UpdateAlbumPhotoInput = z.infer<typeof UpdateAlbumPhotoInputSchema>;

export const DeletePhotoInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type DeletePhotoInput = z.infer<typeof DeletePhotoInputSchema>;

// ---------------------------------------------------------------------------
// Outputs (unwrapped `data` payloads)
// ---------------------------------------------------------------------------

/**
 * Photo payload returned by every photo endpoint. `albumId` is nullable
 * because empty-album photos have no album assignment on the Prisma row.
 */
export const PhotoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  albumId: z.number().int().nullable().optional(),
  isCover: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Photo = z.infer<typeof PhotoSchema>;

export const PaginatedPhotosSchema = z.object({
  data: z.array(PhotoSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
  total: z.number().int().optional(),
});

export type PaginatedPhotos = z.infer<typeof PaginatedPhotosSchema>;
