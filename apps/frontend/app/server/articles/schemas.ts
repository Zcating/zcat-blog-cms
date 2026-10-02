/*
 * The `{ code, message, data }`
 * envelope is unwrapped by `parseEnvelope`; these schemas only
 * describe the payload that lives in `data`.
 *
 * Sources:
 *   - apps/backend/src/features/cms/article/article.schema.ts
 *   - apps/backend/src/features/cms/article/article.service.ts
 *   - apps/backend/src/model/paginate-query.schema.ts
 */

import { z } from 'zod';

/**
 * Mirrors the backend's `safeNumber` helper so the server function
 * input matches what Hono's `zValidator('query')` would produce.
 */
const coercePage = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
});

const coercePageSize = z.union([z.number(), z.string()]).transform((value) => {
  if (typeof value === 'number') return value;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
});

export const GetArticlesInputSchema = z.object({
  page: coercePage.optional().default(1),
  pageSize: coercePageSize.optional().default(10),
});

export type GetArticlesInput = z.infer<typeof GetArticlesInputSchema>;

export const GetArticleInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetArticleInput = z.infer<typeof GetArticleInputSchema>;

export const CreateArticleInputSchema = z.object({
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  publishAt: z.coerce.date().optional(),
  tagIds: z.array(z.coerce.number().int()).optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleInputSchema>;

export const UpdateArticleInputSchema = z.object({
  id: z.coerce.number().int().positive(),
  title: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  publishAt: z.coerce.date().optional(),
  tagIds: z.array(z.coerce.number().int()).optional(),
});

export type UpdateArticleInput = z.infer<typeof UpdateArticleInputSchema>;

export const DeleteArticleInputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type DeleteArticleInput = z.infer<typeof DeleteArticleInputSchema>;

export const UploadArticleImagesInputSchema = z.object({
  images: z.array(z.string()),
});

export type UploadArticleImagesInput = z.infer<
  typeof UploadArticleImagesInputSchema
>;

/**
 * The article SELECT in `articleService.findAll` does NOT include
 * `content` — only the listing columns. We mirror the real backend
 * SELECT here.
 */
export const ArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  excerpt: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createByUserId: z.number().int().nullable().optional(),
  publishAt: z.coerce.date(),
});

export type Article = z.infer<typeof ArticleSchema>;

export const PaginatedArticlesSchema = z.object({
  data: z.array(ArticleSchema),
  totalPages: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
});

export type PaginatedArticles = z.infer<typeof PaginatedArticlesSchema>;
