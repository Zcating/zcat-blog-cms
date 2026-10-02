import { z } from 'zod';

export const CreateArticleTagDtoSchema = z.object({
  name: z.string().min(1, '标签名称不能为空'),
});

export const UpdateArticleTagDtoSchema = z.object({
  name: z.string().optional(),
});

export type CreateArticleTagDto = z.infer<typeof CreateArticleTagDtoSchema>;
export type UpdateArticleTagDto = z.infer<typeof UpdateArticleTagDtoSchema>;
