/*
 * The `{ code, message, data }` envelope is unwrapped by `parseEnvelope`;
 * these schemas only describe the payload that lives in `data`. They mirror
 * apps/backend/src/features/cms/photo-album/*.schema.ts and the Prisma
 * SELECTs in photo-album.service.ts / photo.service.ts.
 */

import { z } from 'zod';

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
 * The backend's `findAll` joins `coverId -> Photo` and returns a full `Photo`
 * row or `null`; empty-album photo rows carry `albumId = null`, hence the
 * nullable `albumId` here.
 */
export const PhotoAlbumCoverSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  signedUrl: z.string(),
  signedThumbnailUrl: z.string(),
  albumId: z.number().int().nullable().optional(),
  isCover: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type PhotoAlbumCover = z.infer<typeof PhotoAlbumCoverSchema>;

/**
 * `description` is always a string on the list response (the backend creates
 * albums with `description ?? ''`), so it is required here.
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
 * `description` and `available` are non-null on the Prisma row but the legacy
 * client interface declared them optional; the lenient shape is kept for
 * forward compatibility with any future backend relaxation.
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
