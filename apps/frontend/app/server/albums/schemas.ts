/*
 * The `{ code, message, data }` envelope is unwrapped by `parseEnvelope`;
 * these schemas only describe the payload that lives in `data`.
 *
 * Sources:
 *   - apps/backend/src/features/cms/photo-album/photo-album.schema.ts
 *   - apps/backend/src/features/cms/photo-album/photo-album.service.ts
 *   - apps/backend/src/features/cms/photo/photo.service.ts
 */

import { z } from 'zod';

// Mirror the backend `safeNumber` style so server function inputs match
// what Hono's `zValidator('query')` would produce.
const coercePage = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
});

const coercePageSize = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
});

export const GetPhotoAlbumsInputSchema = z.object({
  page: coercePage.optional().default(1),
  pageSize: coercePageSize.optional().default(10),
});

export type GetPhotoAlbumsInput = z.infer<typeof GetPhotoAlbumsInputSchema>;

export const GetPhotoAlbumInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetPhotoAlbumInput = z.infer<typeof GetPhotoAlbumInputSchema>;

export const CreatePhotoAlbumInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(''),
  available: z.boolean().default(false),
});

export type CreatePhotoAlbumInput = z.infer<typeof CreatePhotoAlbumInputSchema>;

/** The id is the route discriminator and is required. */
export const UpdatePhotoAlbumInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().optional(),
  description: z.string().optional(),
  available: z.boolean().optional(),
});

export type UpdatePhotoAlbumInput = z.infer<typeof UpdatePhotoAlbumInputSchema>;

export const SetPhotoAlbumCoverInputSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive(),
});

export type SetPhotoAlbumCoverInput = z.infer<
  typeof SetPhotoAlbumCoverInputSchema
>;

export const AddPhotosInputSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  photoIds: z.array(z.coerce.number().int().positive()).min(1),
});

export type AddPhotosInput = z.infer<typeof AddPhotosInputSchema>;

/**
 * Input for `deletePhotoAlbum`. The backend accepts a string `id`
 * (`z.object({ id: z.string() })`), but the RPC surface preserves the
 * legacy `number` id shape and the helper stringifies it on the wire.
 */
export const DeletePhotoAlbumInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type DeletePhotoAlbumInput = z.infer<typeof DeletePhotoAlbumInputSchema>;

/**
 * Cover photo embedded in the album list response.
 *
 * The backend `findAll` joins `PhotoAlbum.coverId -> Photo` and returns
 * either a full `Photo` row or `null`. Empty-album photo rows have
 * `albumId = null`, which is why the schema accepts that.
 */
export const PhotoAlbumCoverSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  albumId: z.number().int().nullable().optional(),
  isCover: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PhotoAlbumCover = z.infer<typeof PhotoAlbumCoverSchema>;

/**
 * List-shape album payload returned by `GET /cms/photo-albums`.
 *
 * The backend's `findAll` projects these fields:
 *   id, name, description, coverId, createdAt, updatedAt, available, cover.
 * `description` is always a string on the list response (the backend
 * creates albums with `description ?? ''`), so it is required here.
 * `available` is non-null on the Prisma row.
 */
export const PhotoAlbumSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  coverId: z.number().int().nullable().optional(),
  available: z.boolean(),
  cover: PhotoAlbumCoverSchema.nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PhotoAlbum = z.infer<typeof PhotoAlbumSchema>;

export const PaginatedPhotoAlbumsSchema = z.object({
  data: z.array(PhotoAlbumSchema),
  page: z.number().int(),
  pageSize: z.number().int(),
  totalPages: z.number().int(),
  total: z.number().int().optional(),
});

export type PaginatedPhotoAlbums = z.infer<typeof PaginatedPhotoAlbumsSchema>;

/**
 * Detail-shape album payload returned by `GET /cms/photo-albums/:id`.
 *
 * The backend `findById` returns the raw Prisma row, so this carries
 * `coverId` only (no embedded `cover` join). `description` and
 * `available` are technically non-null on the Prisma row but the legacy
 * client interface declared them optional; we preserve the lenient shape
 * for forward compatibility with any future backend relaxation.
 */
export const PhotoAlbumDetailSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string().optional(),
  coverId: z.number().int().nullable().optional(),
  available: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PhotoAlbumDetail = z.infer<typeof PhotoAlbumDetailSchema>;
