import { z } from 'zod';

const IdSegmentSchema = z.string().regex(/^[A-Za-z0-9_-]+$/);

export const GetGalleryListInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(8),
});

export type GetGalleryListInput = z.infer<typeof GetGalleryListInputSchema>;

export const GetGalleryDetailInputSchema = z.object({
  id: IdSegmentSchema,
});

export type GetGalleryDetailInput = z.infer<typeof GetGalleryDetailInputSchema>;

export const PhotoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  albumId: z.number().int().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Photo = z.infer<typeof PhotoSchema>;

export const GallerySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  description: z.string(),
  cover: PhotoSchema.nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Gallery = z.infer<typeof GallerySchema>;

export const GalleryDetailSchema = GallerySchema.extend({
  photos: z.array(PhotoSchema),
});

export type GalleryDetail = z.infer<typeof GalleryDetailSchema>;

export const GalleryListSchema = z.object({
  data: z.array(GallerySchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type GalleryList = z.infer<typeof GalleryListSchema>;
