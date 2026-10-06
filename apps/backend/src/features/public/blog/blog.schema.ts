import { z } from 'zod';

export interface BlogVisitorDto {
  pagePath: string;
  pageTitle: string;
  referrer: string;
  browser: string;
  os: string;
  device: string;
  deviceId: string;
}

export const BlogPhotoDtoSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
  albumId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  signedUrl: z.string(),
  signedThumbnailUrl: z.string(),
});

export type BlogPhotoDto = z.infer<typeof BlogPhotoDtoSchema>;

export const BlogPhotoFeedItemDtoSchema = BlogPhotoDtoSchema.extend({
  albumName: z.string(),
});

export type BlogPhotoFeedItemDto = z.infer<typeof BlogPhotoFeedItemDtoSchema>;

export const BlogUserInfoDtoSchema = z.object({
  name: z.string(),
  occupation: z.string(),
  abstract: z.string(),
  aboutMe: z.string(),
  avatar: z.string(),
  signedAvatar: z.string(),
  contact: z.record(z.string(), z.string()),
});

export type BlogUserInfoDto = z.infer<typeof BlogUserInfoDtoSchema>;
