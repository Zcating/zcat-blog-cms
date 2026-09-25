/**
 * TanStack Start server-function lane for the article-tags domain.
 *
 * Migrates the legacy `ArticleTagsApi` operation surface onto the
 * Phase-2a shared server boundary:
 *
 *   - listArticleTags       — GET    /cms/article-tags         (protected)
 *   - getArticleTag         — GET    /cms/article-tags/:id     (protected)
 *   - createArticleTag      — POST   /cms/article-tags         (protected)
 *   - updateArticleTag      — PUT    /cms/article-tags/:id     (protected)
 *   - deleteArticleTag      — DELETE /cms/article-tags/:id     (protected)
 *
 * Server functions are thin shells over the pure helpers in
 * `./article-tags-helpers.ts`. Each protected function composes the
 * shared `createProtectedFunctionMiddleware`. Endpoint paths, payload
 * shapes, and the ResultCode -> ApiErrorTag mapping are preserved
 * from the legacy `app/api/interfaces/article-tags-api.ts`.
 *
 * Stable `queryOptions` factories are exported for Phase 3 consumers
 * (loaders, route components). They reference the server functions by
 * identity so the cache key stays in sync with the RPC.
 */

import { queryOptions } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';

import { createProtectedFunctionMiddleware } from '@cms/server/auth-middleware';
import { resolveBackendApiUrl } from '@cms/server/env';

import {
  createArticleTag as createArticleTagHelper,
  deleteArticleTag as deleteArticleTagHelper,
  fetchArticleTag as fetchArticleTagHelper,
  listArticleTags as listArticleTagsHelper,
  updateArticleTag as updateArticleTagHelper,
} from './article-tags-helpers';
import {
  CreateArticleTagInputSchema,
  DeleteArticleTagInputSchema,
  GetArticleTagInputSchema,
  UpdateArticleTagInputSchema,
  type CreateArticleTagInput,
  type DeleteArticleTagInput,
  type GetArticleTagInput,
  type UpdateArticleTagInput,
} from './schemas';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

const protectedMiddleware = createProtectedFunctionMiddleware();

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const listArticleTagsServerFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async () =>
    listArticleTagsHelper({
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const getArticleTagServerFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): GetArticleTagInput => GetArticleTagInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    fetchArticleTagHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const createArticleTagServerFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): CreateArticleTagInput =>
      CreateArticleTagInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    createArticleTagHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const updateArticleTagServerFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): UpdateArticleTagInput =>
      UpdateArticleTagInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    updateArticleTagHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

export const deleteArticleTagServerFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(
    (data: unknown): DeleteArticleTagInput =>
      DeleteArticleTagInputSchema.parse(data),
  )
  .handler(async ({ data }) =>
    deleteArticleTagHelper(data, {
      env: { resolveBaseUrl: resolveBackendApiUrl },
    }),
  );

// ---------------------------------------------------------------------------
// Stable queryOptions factories
// ---------------------------------------------------------------------------

/**
 * `queryOptions` for the article-tag list. Stable across calls so
 * Phase 3 consumers can place it in module-scope consts.
 */
export function articleTagsListQueryOptions() {
  return queryOptions({
    queryKey: ['article-tags', 'list'] as const,
    queryFn: () => listArticleTagsServerFn(),
  });
}

/**
 * `queryOptions` for a single article-tag read. Keyed by id.
 */
export function articleTagDetailQueryOptions(input: GetArticleTagInput) {
  return queryOptions({
    queryKey: ['article-tags', 'detail', input.id] as const,
    queryFn: () => getArticleTagServerFn({ data: input }),
  });
}
