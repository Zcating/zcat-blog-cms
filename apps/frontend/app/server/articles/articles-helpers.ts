/**
 * Pure (testable) server-boundary helpers for the articles domain.
 *
 * These helpers are the single source of truth for the Fastify fetch
 * shape of every article operation. The TanStack Start server
 * functions in `./index.ts` are a thin shell that wires each helper
 * to its middleware + validator. Tests inject `fetch` directly into
 * the helpers — the ONLY mocked boundary.
 *
 * Design rules (per Phase 2b contract):
 *   - Endpoints preserved: /cms/articles (GET), /cms/articles/detail
 *     (GET), /cms/articles/create (POST), /cms/articles/update (POST),
 *     /cms/articles/delete (POST), /cms/articles/upload-images (POST).
 *   - Payload shapes preserved: input objects mirror the backend
 *     Hono `zValidator('query' / 'json')` schemas; output schemas
 *     mirror the Prisma SELECT returned by the service.
 *   - Errors map through the shared `envelopeToApiError` so the
 *     existing ResultCode -> ApiErrorTag vocabulary is reused.
 *   - No `/api/bff/*`. No `VITE_*` fallback. No retries.
 *   - Reads delegate to the shared `getAuthorizedJson` from
 *     `@cms/server/transport`; writes delegate to `postAuthorizedJson`.
 *     No domain-local fetch plumbing remains.
 */

import { z } from 'zod';

import type { CookieIO } from '@cms/server/cookies';
import { resolveBackendApiUrl } from '@cms/server/env';
import {
  getAuthorizedJson,
  postAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

import {
  ArticleSchema,
  CreateArticleInputSchema,
  DeleteArticleInputSchema,
  GetArticleInputSchema,
  GetArticlesInputSchema,
  PaginatedArticlesSchema,
  UpdateArticleInputSchema,
  UploadArticleImagesInputSchema,
  type Article,
  type CreateArticleInput,
  type DeleteArticleInput,
  type GetArticleInput,
  type GetArticlesInput,
  type PaginatedArticles,
  type UpdateArticleInput,
  type UploadArticleImagesInput,
} from './schemas';

// ---------------------------------------------------------------------------
// Options plumbing
// ---------------------------------------------------------------------------

export interface FetchOptions {
  env?: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

// ---------------------------------------------------------------------------
// Void success envelope (data: null).
// ---------------------------------------------------------------------------

const voidDataSchema = z.unknown();

// ---------------------------------------------------------------------------
// fetchArticles
// ---------------------------------------------------------------------------

export async function fetchArticles(
  input: GetArticlesInput | undefined,
  options: FetchOptions = {},
): Promise<PaginatedArticles> {
  const params = GetArticlesInputSchema.parse(input ?? {});
  return getAuthorizedJson<PaginatedArticles>({
    path: '/cms/articles',
    query: { page: params.page, pageSize: params.pageSize },
    dataSchema: PaginatedArticlesSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

// ---------------------------------------------------------------------------
// fetchArticle
// ---------------------------------------------------------------------------

export async function fetchArticle(
  input: GetArticleInput,
  options: FetchOptions = {},
): Promise<Article> {
  const params = GetArticleInputSchema.parse(input);
  return getAuthorizedJson<Article>({
    path: '/cms/articles/detail',
    query: { id: params.id },
    dataSchema: ArticleSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

// ---------------------------------------------------------------------------
// createArticle
// ---------------------------------------------------------------------------

export async function createArticle(
  input: CreateArticleInput,
  options: FetchOptions = {},
): Promise<Article> {
  const params = CreateArticleInputSchema.parse(input);
  return postAuthorizedJson<Article>({
    path: '/cms/articles/create',
    body: params,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: ArticleSchema,
  });
}

// ---------------------------------------------------------------------------
// updateArticle
// ---------------------------------------------------------------------------

export async function updateArticle(
  input: UpdateArticleInput,
  options: FetchOptions = {},
): Promise<Article> {
  const params = UpdateArticleInputSchema.parse(input);
  return postAuthorizedJson<Article>({
    path: '/cms/articles/update',
    body: params,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: ArticleSchema,
  });
}

// ---------------------------------------------------------------------------
// deleteArticle
// ---------------------------------------------------------------------------

export async function deleteArticle(
  input: DeleteArticleInput,
  options: FetchOptions = {},
): Promise<void> {
  const params = DeleteArticleInputSchema.parse(input);
  await postAuthorizedJson<unknown>({
    path: '/cms/articles/delete',
    body: { id: params.id },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}

// ---------------------------------------------------------------------------
// fetchArticleUploadImages
// ---------------------------------------------------------------------------

export async function fetchArticleUploadImages(
  input: UploadArticleImagesInput,
  options: FetchOptions = {},
): Promise<string[]> {
  const params = UploadArticleImagesInputSchema.parse(input);
  return postAuthorizedJson<string[]>({
    path: '/cms/articles/upload-images',
    body: { images: params.images },
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: z.array(z.string()),
  });
}
