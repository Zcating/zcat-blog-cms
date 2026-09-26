import { ApiErrorException, envelopeToApiError } from './errors';
import {
  parseEnvelope,
  responseValidationError,
  ResponseValidationError,
  type DataSchema,
} from './result';

export interface BackendEnv {
  resolveBaseUrl: () => string;
}

export type FetchLike = (
  input: string | URL,
  init?: RequestInit,
) => Promise<Response>;

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

interface JsonEnvelope {
  code: string;
  message: string;
  data: unknown;
}

export interface GetJsonOptions<T> {
  path: string;
  env: BackendEnv;
  query?: Record<string, string | number | undefined>;
  dataSchema?: DataSchema<T>;
  fetch?: FetchLike;
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

function resolveUrl(
  env: BackendEnv,
  path: string,
  query: Record<string, string | number | undefined> | undefined,
): string {
  const base = env.resolveBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const builtQuery = buildQueryString(query ?? {});
  const hasInlineQuery = normalizedPath.includes('?');
  return `${base}${normalizedPath}${
    builtQuery && !hasInlineQuery ? builtQuery : ''
  }`;
}

function isEnvelope(body: unknown): body is JsonEnvelope {
  return (
    !!body && typeof body === 'object' && 'code' in body && 'message' in body
  );
}

async function sendAndParse<T>(
  url: string,
  fetchImpl: FetchLike,
  dataSchema?: DataSchema<T>,
): Promise<T> {
  const response = await fetchImpl(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw responseValidationError('Backend response was not valid JSON', null, [
      { path: '<response>', message: 'invalid JSON body' },
    ]);
  }

  if (!isEnvelope(body)) {
    throw responseValidationError(
      'Response is missing the { code, message, data } envelope',
      body,
    );
  }

  if (body.code !== '0000') {
    const apiError = envelopeToApiError(body);
    if (apiError) {
      throw new ApiErrorException(apiError);
    }
    throw responseValidationError(
      'Non-success response with no ApiError mapping',
      body,
    );
  }

  try {
    return parseEnvelope<T>(body, dataSchema);
  } catch (error) {
    if (error instanceof ResponseValidationError) {
      throw error;
    }
    throw responseValidationError(
      'Success envelope failed schema validation',
      body,
      [
        {
          path: 'envelope',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    );
  }
}

export async function getJson<T = unknown>(
  options: GetJsonOptions<T>,
): Promise<T> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const url = resolveUrl(options.env, options.path, options.query);
  return sendAndParse<T>(url, fetchImpl, options.dataSchema);
}
