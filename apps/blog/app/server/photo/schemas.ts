import { z } from 'zod';

export const GetPhotoListInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(12),
});

export type GetPhotoListInput = z.infer<typeof GetPhotoListInputSchema>;

export const PhotoFeedItemSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  signedUrl: z.string(),
  signedThumbnailUrl: z.string(),
  thumbnailUrl: z.string(),
  albumId: z.number().int(),
  albumName: z.string(),
  createdAt: z.string().optional(),
});

export type PhotoFeedItem = z.infer<typeof PhotoFeedItemSchema>;

export const PhotoListSchema = z.object({
  data: z.array(PhotoFeedItemSchema),
  total: z.number().int(),
  totalPages: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type PhotoList = z.infer<typeof PhotoListSchema>;
