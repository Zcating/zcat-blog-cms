import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { PaginateQuerySchema } from '@backend/model';

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
  url: z.string(),
  thumbnailUrl: z.string(),
});

export const AddPhotosDtoSchema = z.object({
  albumId: z.coerce.number().int().positive(),
  photoIds: z.array(z.coerce.number().int()),
});

export const UpdatePhotoDtoSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().optional(),
  albumId: z.coerce.number().int().positive().optional(),
  url: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

export const GetPhotosDtoSchema = z.object({
  albumId: z.coerce.number().int().positive().optional(),
  ...PaginateQuerySchema.shape,
});

export class CreatePhotoDto extends createZodDto(CreatePhotoDtoSchema) {}
export class AddPhotosDto extends createZodDto(AddPhotosDtoSchema) {}
export class UpdatePhotoDto extends createZodDto(UpdatePhotoDtoSchema) {}
export class GetPhotosDto extends createZodDto(GetPhotosDtoSchema) {}

export interface UpdateAlbumPhotoResultDto {
  id: number;
  name: string;
  url: string;
  isCover: boolean;
  thumbnailUrl: string;
  albumId: number;
  createdAt: Date;
  updatedAt: Date;
}
