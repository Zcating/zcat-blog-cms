import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateArticleTagDtoSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
});

export const UpdateArticleTagDtoSchema = z.object({
  name: z.string().optional(),
});

export class CreateArticleTagDto extends createZodDto(
  CreateArticleTagDtoSchema,
) {}

export class UpdateArticleTagDto extends createZodDto(
  UpdateArticleTagDtoSchema,
) {}
