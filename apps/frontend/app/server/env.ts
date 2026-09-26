/*
 * Server functions read `BACKEND_API_URL` per request (NOT at module
 * scope). This matches the TanStack Start execution model where module
 * scope runs before any request exists and edge runtimes inject env
 * per-request.
 *
 * The resolver trims trailing slashes so the caller can safely do
 * `${baseUrl}${path}` without worrying about a doubled slash.
 */

export class BackendUrlMissingError extends Error {
  readonly code = 'BackendUrlMissingError';
  readonly name = 'BackendUrlMissingError';

  constructor(
    message = 'BACKEND_API_URL environment variable is required for server functions',
  ) {
    super(message);
  }
}

/**
 * There is intentionally NO `VITE_*` fallback — public client
 * variables must never leak into the server-side boundary.
 */
export function resolveBackendApiUrl(): string {
  const raw = process.env.BACKEND_API_URL;
  if (typeof raw !== 'string') {
    throw new BackendUrlMissingError();
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new BackendUrlMissingError();
  }
  return trimmed.replace(/\/+$/, '');
}
