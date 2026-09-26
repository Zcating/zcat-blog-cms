import { z } from 'zod';

const IdSegmentSchema = z.string().regex(/^[A-Za-z0-9_-]+$/);

export const GetArticleListInputSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
  order: z.enum(['latest', 'oldest']).default('latest'),
});

export type GetArticleListInput = z.infer<typeof GetArticleListInputSchema>;

export const GetArticleDetailInputSchema = z.object({
  id: IdSegmentSchema,
});

export type GetArticleDetailInput = z.infer<typeof GetArticleDetailInputSchema>;

const ArticleTagSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

const ArticleTagJoinSchema = z.object({
  articleId: z.number().int(),
  articleTagId: z.number().int(),
  articleTag: ArticleTagSchema.optional(),
});

export const ArticleSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  createByUserId: z.number().int().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishAt: z.string(),
  articleAndArticleTags: z.array(ArticleTagJoinSchema).default([]),
});

export type Article = z.infer<typeof ArticleSchema>;

export const ArticleDetailSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishAt: z.string(),
  articleAndArticleTags: z.array(ArticleTagJoinSchema).default([]),
});

export type ArticleDetail = z.infer<typeof ArticleDetailSchema>;

export const ArticleListSchema = z.object({
  data: z.array(ArticleSchema),
  totalPages: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
});

export type ArticleList = z.infer<typeof ArticleListSchema>;
