/**
 * Pure (testable) server-boundary helpers for the article-tags domain.
 *
 * These helpers are the single source of truth for the Fastify fetch
 * shape of every article-tag operation. The TanStack Start server
 * functions in `./index.ts` are a thin shell that wires each helper
 * to its middleware + validator. Tests inject `fetch` directly into
 * the helpers — the ONLY mocked boundary.
 *
 * Design rules (per Phase 2b contract):
 *   - Endpoints preserved: /cms/article-tags (GET), /cms/article-tags/:id
 *     (GET), /cms/article-tags (POST), /cms/article-tags/:id (PUT),
 *     /cms/article-tags/:id (DELETE).
 *   - Payload shapes preserved: input objects mirror the backend
 *     Hono `zValidator('json')` schemas; output schemas mirror the
 *     Prisma `findMany` / `findUnique` results.
 *   - Errors map through the shared `envelopeToApiError` so the
 *     existing ResultCode -> ApiErrorTag vocabulary is reused.
 *   - No `/api/bff/*`. No `VITE_*` fallback. No retries.
 *   - GETs delegate to the shared `getAuthorizedJson` from
 *     `@cms/server/transport`; POSTs/DELETEs delegate to the shared
 *     `postAuthorizedJson` / `deleteAuthorized`. The PUT update
 *     method is non-standard in the shared transport, so a single
 *     minimal PUT helper remains in this file.
 */

import { z } from 'zod';

import { authorizeFromCookie, type CookieIO } from '@cms/server/cookies';
import { envelopeToApiError, type ApiError } from '@cms/server/errors';
import { resolveBackendApiUrl } from '@cms/server/env';
import {
  parseEnvelope,
  ResponseValidationError,
  envelopeSchema,
  type DataSchema,
} from '@cms/server/result';
import {
  deleteAuthorized,
  getAuthorizedJson,
  postAuthorizedJson,
  type BackendEnv,
  type FetchLike,
} from '@cms/server/transport';

import {
  ArticleTagSchema,
  CreateArticleTagInputSchema,
  DeleteArticleTagInputSchema,
  GetArticleTagInputSchema,
  UpdateArticleTagInputSchema,
  type ArticleTag,
  type CreateArticleTagInput,
  type DeleteArticleTagInput,
  type GetArticleTagInput,
  type UpdateArticleTagInput,
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
// Local PUT helper.
//
// The shared `transport.ts` exposes GET / POST / DELETE; the article-tags
// update endpoint is a PUT, so a single minimal inline helper remains in
// this file. It composes the same `Authorize`, `Content-Type`, and
// envelope/error primitives as the shared transport without re-reading
// or re-implementing them.
// ---------------------------------------------------------------------------

interface PutAuthorizedOptions {
  env: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
  path: string;
  body: unknown;
  dataSchema?: DataSchema<unknown>;
}

async function putAuthorizedJson<T = unknown>(
  options: PutAuthorizedOptions,
): Promise<T> {
  const fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
  const cookie = options.cookie;

  const base = options.env.resolveBaseUrl();
  const normalizedPath = options.path.startsWith('/')
    ? options.path
    : `/${options.path}`;
  const url = `${base}${normalizedPath}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (cookie) {
    const auth = authorizeFromCookie(cookie);
    if (auth) headers.Authorization = auth;
  }

  const init: RequestInit = {
    method: 'PUT',
    headers,
    body: JSON.stringify(options.body),
  };

  const response = await fetchImpl(url, init);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ResponseValidationError(
      'Backend response was not valid JSON',
      null,
      [{ path: '<response>', message: 'invalid JSON body' }],
    );
  }

  const envelopeCheck = envelopeSchema.safeParse(body);
  if (!envelopeCheck.success) {
    throw new ResponseValidationError(
      'Response is missing the { code, message, data } envelope',
      body,
    );
  }

  if (envelopeCheck.data.code !== '0000') {
    const apiError: ApiError | null = envelopeToApiError(envelopeCheck.data);
    if (apiError) throw apiError;
    throw new ResponseValidationError(
      'Non-success response with no ApiError mapping',
      envelopeCheck.data,
    );
  }

  return parseEnvelope<T>(envelopeCheck.data, options.dataSchema as never);
}

// ---------------------------------------------------------------------------
// Void success envelope (data: null).
// ---------------------------------------------------------------------------

const voidDataSchema = z.unknown();

// ---------------------------------------------------------------------------
// listArticleTags
// ---------------------------------------------------------------------------

export async function listArticleTags(
  options: FetchOptions = {},
): Promise<ArticleTag[]> {
  return getAuthorizedJson<ArticleTag[]>({
    path: '/cms/article-tags',
    dataSchema: z.array(ArticleTagSchema),
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

// ---------------------------------------------------------------------------
// fetchArticleTag
// ---------------------------------------------------------------------------

export async function fetchArticleTag(
  input: GetArticleTagInput,
  options: FetchOptions = {},
): Promise<ArticleTag> {
  const params = GetArticleTagInputSchema.parse(input);
  return getAuthorizedJson<ArticleTag>({
    path: `/cms/article-tags/${params.id}`,
    dataSchema: ArticleTagSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

// ---------------------------------------------------------------------------
// createArticleTag
// ---------------------------------------------------------------------------

export async function createArticleTag(
  input: CreateArticleTagInput,
  options: FetchOptions = {},
): Promise<ArticleTag> {
  const params = CreateArticleTagInputSchema.parse(input);
  return postAuthorizedJson<ArticleTag>({
    path: '/cms/article-tags',
    body: params,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: ArticleTagSchema,
  });
}

// ---------------------------------------------------------------------------
// updateArticleTag
// ---------------------------------------------------------------------------

export async function updateArticleTag(
  input: UpdateArticleTagInput,
  options: FetchOptions = {},
): Promise<ArticleTag> {
  const params = UpdateArticleTagInputSchema.parse(input);
  return putAuthorizedJson<ArticleTag>({
    path: `/cms/article-tags/${params.id}`,
    body: { name: params.name },
    dataSchema: ArticleTagSchema,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
  });
}

// ---------------------------------------------------------------------------
// deleteArticleTag
// ---------------------------------------------------------------------------

export async function deleteArticleTag(
  input: DeleteArticleTagInput,
  options: FetchOptions = {},
): Promise<void> {
  const params = DeleteArticleTagInputSchema.parse(input);
  await deleteAuthorized<unknown>({
    path: `/cms/article-tags/${params.id}`,
    env: options.env ?? defaultEnv,
    cookie: options.cookie,
    fetch: options.fetch,
    dataSchema: voidDataSchema,
  });
}
