import { z } from 'zod';

import { OssObjectKeySchema, PaginateQuerySchema } from '@backend/model';

export const CreatePhotoDtoSchema = z.object({
  name: z.string().min(1, '照片名称不能为空').max(32),
  albumId: z.coerce.number().int().optional(),
  isCover: z
    .preprocess((v) => {
      if (v === 'true') return true;
      if (v === 'false') return false;
      return v;
    }, z.boolean())
    .optional(),
  url: OssObjectKeySchema,
  thumbnailUrl: OssObjectKeySchema,
});

export const AddPhotosDtoSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  photoIds: z.array(z.coerce.number().int()),
});

export const UpdatePhotoDtoSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().optional(),
  albumId: z.coerce.number().int().positive().optional(),
  url: OssObjectKeySchema.optional(),
  thumbnailUrl: OssObjectKeySchema.optional(),
});

export const GetPhotosDtoSchema = z.object({
  albumId: z.coerce.number().int().positive().optional(),
  ...PaginateQuerySchema.shape,
});

export type CreatePhotoDto = z.infer<typeof CreatePhotoDtoSchema>;
export type AddPhotosDto = z.infer<typeof AddPhotosDtoSchema>;
export type UpdatePhotoDto = z.infer<typeof UpdatePhotoDtoSchema>;
export type GetPhotosDto = z.infer<typeof GetPhotosDtoSchema>;

export const PhotoResponseDtoSchema = z.object({
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

export type PhotoResponseDto = z.infer<typeof PhotoResponseDtoSchema>;

export interface UpdateAlbumPhotoResultDto extends PhotoResponseDto {
  albumId: number;
  isCover: boolean;
}
