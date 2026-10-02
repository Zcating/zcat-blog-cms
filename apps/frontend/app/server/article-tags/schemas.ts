/*
 * The `{ code, message, data }`
 * envelope is unwrapped by `parseEnvelope`; these schemas only
 * describe the payload that lives in `data`.
 *
 * Sources:
 *   - apps/backend/src/features/cms/article-tag/article-tag.schema.ts
 *   - apps/backend/src/features/cms/article-tag/article-tag.service.ts
 */

import { z } from 'zod';

export const ListArticleTagsInputSchema = z.object({}).optional();

export type ListArticleTagsInput = z.infer<typeof ListArticleTagsInputSchema>;

export const GetArticleTagInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetArticleTagInput = z.infer<typeof GetArticleTagInputSchema>;

export const CreateArticleTagInputSchema = z.object({
  name: z.string().min(1),
});

export type CreateArticleTagInput = z.infer<typeof CreateArticleTagInputSchema>;

export const UpdateArticleTagInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.string().optional(),
});

export type UpdateArticleTagInput = z.infer<typeof UpdateArticleTagInputSchema>;

export const DeleteArticleTagInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type DeleteArticleTagInput = z.infer<typeof DeleteArticleTagInputSchema>;

/**
 * Mirrors `prisma.articleTag.findMany()` — the backend does not
 * project any subset, so all four columns come back.
 */
export const ArticleTagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type ArticleTag = z.infer<typeof ArticleTagSchema>;
