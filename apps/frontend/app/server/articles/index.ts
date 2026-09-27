/*
 * Articles operation surface. Server functions are thin shells over the pure
 * helpers in `./articles-helpers.ts`; every protected function composes the
 * shared `createProtectedFunctionMiddleware`. The `queryOptions` factories
 * reference the server functions by identity so the cache key stays in sync
 * with the RPC.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import { resolveBackendApiUrl } from '@cms/server/env';

import {
  createArticle as createArticleHelper,
  deleteArticle as deleteArticleHelper,
  fetchArticle as fetchArticleHelper,
  fetchArticles as fetchArticlesHelper,
  fetchArticleUploadImages as fetchArticleUploadImagesHelper,
  updateArticle as updateArticleHelper,
} from './articles-helpers';
import {
  CreateArticleInputSchema,
  DeleteArticleInputSchema,
  GetArticleInputSchema,
  GetArticlesInputSchema,
  UpdateArticleInputSchema,
  UploadArticleImagesInputSchema,
  type CreateArticleInput,
  type DeleteArticleInput,
  type GetArticleInput,
  type GetArticlesInput,
  type UpdateArticleInput,
  type UploadArticleImagesInput,
} from './schemas';

const protectedMiddleware = createProtectedFunctionMiddleware();

export const getArticles = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetArticlesInput =>
      GetArticlesInputSchema.parse(data ?? {}),
  )
  .handler(async ({ data }) =>
    fetchArticlesHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const getArticle = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetArticleInput => GetArticleInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    fetchArticleHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const createArticle = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): CreateArticleInput => CreateArticleInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    createArticleHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const updateArticle = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdateArticleInput => UpdateArticleInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    updateArticleHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const deleteArticle = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): DeleteArticleInput => DeleteArticleInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    deleteArticleHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const uploadArticleImages = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UploadArticleImagesInput =>
      UploadArticleImagesInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    fetchArticleUploadImagesHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

/**
 * Keyed by the
 * `(page, pageSize)` tuple so each page has its own cache slot.
 */
export function articlesListQueryOptions(
  input: Partial<GetArticlesInput> = {},
) {
  const resolved: GetArticlesInput = GetArticlesInputSchema.parse(input);
  return queryOptions({
    queryKey: ['articles', 'list', resolved] as const,
    queryFn: () => getArticles({ data: resolved }),
  });
}

/** Keyed by id. */
export function articleDetailQueryOptions(input: GetArticleInput) {
  return queryOptions({
    queryKey: ['articles', 'detail', input.id] as const,
    queryFn: () => getArticle({ data: input }),
  });
}
