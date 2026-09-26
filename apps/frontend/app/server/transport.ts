/**
 * Explicit-operation transport helpers.
 *
 * Replaces the legacy generic `HttpClient.post(path, ...)` API. Each
 * helper is a concrete operation (postJson, postAuthorizedJson,
 * deleteAuthorized, getAuthorizedJson) so domain code never picks an
 * endpoint conditionally.
 *
 * Rules enforced by every helper in this file:
 *   1. No automatic retries. The `fetch` boundary is called exactly once.
 *   2. No `/api/bff/*` URLs. Only the resolved backend base URL is used.
 *   3. The base URL is taken from the injected `env` resolver (which
 *      itself reads `BACKEND_API_URL` per request). No `VITE_*` fallback.
 *   4. Authorization is forwarded ONLY for the `*Authorized*` helpers,
 *      and ONLY from the request's session Cookie (no implicit
 *      cross-request leakage).
 *   5. The shared `fetch` boundary is the only thing tests may mock.
 */

import { envelopeToApiError } from './errors';
import { authorizeFromCookie, liveCookieIO, type CookieIO } from './cookies';
import {
  parseEnvelope,
  responseValidationError,
  type DataSchema,
} from './result';

/** Pluggable base URL resolution. Keeps tests independent of `process.env`. */
export interface BackendEnv {
  resolveBaseUrl: () => string;
}

/** Pluggable `fetch` for tests. The default delegates to the global. */
export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

interface JsonResult {
  code: string;
  message: string;
  data: unknown;
}

interface BaseCallOptions {
  path: string;
  env: BackendEnv;
  cookie?: CookieIO;
  fetch?: FetchLike;
}

interface GetAuthorizedOptions<T> extends BaseCallOptions {
  query?: Record<string, string | number | undefined>;
  dataSchema?: DataSchema<T>;
}

interface PostJsonOptions extends BaseCallOptions {
  body: unknown;
}

interface DeleteAuthorizedOptions extends BaseCallOptions {}

function buildHeaders(
  extra: Record<string, string> | undefined,
  cookie: CookieIO,
  withAuthorization: boolean,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(extra ?? {}),
  };
  if (withAuthorization) {
    const auth = authorizeFromCookie(cookie);
    if (auth) {
      headers['Authorization'] = auth;
    }
  }
  return headers;
}

async function sendAndParse<T>(
  url: string,
  init: RequestInit,
  fetchImpl: FetchLike,
  dataSchema?: DataSchema<T>,
): Promise<T> {
  const response = await fetchImpl(url, init);
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw responseValidationError('Backend response was not valid JSON', null, [
      { path: '<response>', message: 'invalid JSON body' },
    ]);
  }

  const envelope: JsonResult | undefined =
    body &&
    typeof body === 'object' &&
    'code' in (body as Record<string, unknown>) &&
    'message' in (body as Record<string, unknown>)
      ? (body as JsonResult)
      : undefined;

  if (!envelope) {
    throw responseValidationError(
      'Response is missing the { code, message, data } envelope',
      body,
    );
  }

  if (envelope.code !== '0000') {
    const apiError = envelopeToApiError(envelope);
    if (apiError) {
      throw apiError;
    }
    // Should not happen — `code !== '0000'` always yields an ApiError.
    throw responseValidationError(
      'Non-success response with no ApiError mapping',
      envelope,
    );
  }

  try {
    return parseEnvelope<T>(envelope, dataSchema);
  } catch (error) {
    if (error instanceof Error && error.name === 'ResponseValidationError') {
      throw error;
    }
    throw responseValidationError(
      'Success envelope failed schema validation',
      envelope,
      [
        {
          path: 'envelope',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    );
  }
}

function resolveUrl(env: BackendEnv, path: string): string {
  const base = env.resolveBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function buildQueryString(
  query: Record<string, string | number | undefined>,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    );
  }
  return parts.length === 0 ? '' : `?${parts.join('&')}`;
}

/**
 * POST a JSON body to the backend (no Authorization forwarding).
 *
 * Use for login-style endpoints where the session Cookie does not yet
 * exist. Authorized operations MUST go through `postAuthorizedJson`
 * instead.
 */
export async function postJson<T = unknown>(
  options: PostJsonOptions & { dataSchema?: DataSchema<T> },
): Promise<T> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const cookie = options.cookie ?? (await liveCookieIO());
  const url = resolveUrl(options.env, options.path);
  const headers = buildHeaders(
    { 'Content-Type': 'application/json' },
    cookie,
    false,
  );
  const init: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(options.body),
  };
  return sendAndParse<T>(url, init, fetchImpl, options.dataSchema);
}

/**
 * POST a JSON body to the backend with the request's Cookie Bearer
 * forwarded as an `Authorization` header. Use for protected writes.
 */
export async function postAuthorizedJson<T = unknown>(
  options: PostJsonOptions & { dataSchema?: DataSchema<T> },
): Promise<T> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const cookie = options.cookie ?? (await liveCookieIO());
  const url = resolveUrl(options.env, options.path);
  const headers = buildHeaders(
    { 'Content-Type': 'application/json' },
    cookie,
    true,
  );
  const init: RequestInit = {
    method: 'POST',
    headers,
    body: JSON.stringify(options.body),
  };
  return sendAndParse<T>(url, init, fetchImpl, options.dataSchema);
}

/**
 * Issue a DELETE to the backend with the request's Cookie Bearer
 * forwarded. Use for protected deletes.
 */
export async function deleteAuthorized<T = unknown>(
  options: DeleteAuthorizedOptions & { dataSchema?: DataSchema<T> },
): Promise<T> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const cookie = options.cookie ?? (await liveCookieIO());
  const url = resolveUrl(options.env, options.path);
  const headers = buildHeaders(undefined, cookie, true);
  const init: RequestInit = {
    method: 'DELETE',
    headers,
  };
  return sendAndParse<T>(url, init, fetchImpl, options.dataSchema);
}

/**
 * Issue a GET to the backend with the request's Cookie Bearer
 * forwarded (when present) and parse the response envelope.
 *
 * Use for protected reads. The optional `query` map is URL-encoded into
 * the query string with `encodeURIComponent`; `undefined` values are
 * dropped so the backend never sees a stray `key=undefined` segment.
 *
 * The `path` may either be the bare route (`/cms/articles`) or a route
 * already containing its own query (`/cms/articles?foo=bar`) — when it
 * does, the helper does NOT append an additional `?` so callers can keep
 * pre-built query strings in `path` without double-encoding.
 */
export async function getAuthorizedJson<T = unknown>(
  options: GetAuthorizedOptions<T>,
): Promise<T> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const cookie = options.cookie ?? (await liveCookieIO());
  const base = options.env.resolveBaseUrl();
  const normalizedPath = options.path.startsWith('/')
    ? options.path
    : `/${options.path}`;
  const builtQuery = buildQueryString(options.query ?? {});
  // If the caller baked a query string into `path`, never append another.
  const hasInlineQuery = normalizedPath.includes('?');
  const url = `${base}${normalizedPath}${
    builtQuery && !hasInlineQuery ? builtQuery : ''
  }`;
  const headers = buildHeaders(undefined, cookie, true);
  const init: RequestInit = {
    method: 'GET',
    headers,
  };
  return sendAndParse<T>(url, init, fetchImpl, options.dataSchema);
}

export { responseValidationError };
