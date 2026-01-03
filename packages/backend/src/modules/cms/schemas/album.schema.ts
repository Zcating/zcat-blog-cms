import type { Photo, PhotoAlbum } from '@backend/prisma';

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreatePhotoAlbumDtoSchema = z.object({
  name: z.string().min(1, '相册名称不能为空'),
  description: z.string().optional().default(''),
  coverId: z
    .preprocess(
      (v) => (v === '' || v === undefined ? null : v),
      z.coerce.number().int().nullable(),
    )
    .optional()
    .default(null),
});

export const CreateAlbumPhotoDtoSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  name: z.string(),
  url: z.string(),
  thumbnailUrl: z.string(),
});

export const UpdateAlbumDtoSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  available: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
  coverId: z.coerce.number().int().positive().optional(),
  photoIds: z.array(z.coerce.number().int().positive()).optional(),
});

export const UpdateAlbumPhotoDtoSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string(),
  isCover: z.preprocess((v) => {
    if (v === 'true') return true;
    if (v === 'false') return false;
    return v;
  }, z.boolean()),
  albumId: z.coerce.number().int().positive(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const SetCoverDtoSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  photoId: z.coerce.number().int().positive(),
});

export class CreatePhotoAlbumDto extends createZodDto(
  CreatePhotoAlbumDtoSchema,
) {}
export class CreateAlbumPhotoDto extends createZodDto(
  CreateAlbumPhotoDtoSchema,
) {}
export class UpdateAlbumDto extends createZodDto(UpdateAlbumDtoSchema) {}
export class UpdateAlbumPhotoDto extends createZodDto(
  UpdateAlbumPhotoDtoSchema,
) {}
export class SetCoverDto extends createZodDto(SetCoverDtoSchema) {}

export interface ReturnPhotoAlbumDto extends Omit<PhotoAlbum, 'coverId'> {
  cover: Photo | null;
}
