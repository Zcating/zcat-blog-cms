import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateArticleDtoSchema = z.object({
  title: z.string().min(1, '标题不能为空'),
  excerpt: z.string().min(1, '摘要不能为空'),
  content: z.string().min(1, '内容不能为空'),
  tagIds: z.array(z.coerce.number().int()).optional(),
});

export const UpdateArticleDtoSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  tagIds: z.array(z.coerce.number().int()).optional(),
});

export class CreateArticleDto extends createZodDto(CreateArticleDtoSchema) {}
export class UpdateArticleDto extends createZodDto(UpdateArticleDtoSchema) {}

export interface ReturnArticleDto {
  id: number;
  title: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
}
