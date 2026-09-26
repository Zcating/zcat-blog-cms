export class BackendUrlMissingError extends Error {
  readonly code = 'BackendUrlMissingError';
  readonly name = 'BackendUrlMissingError';

  constructor(
    message = 'BACKEND_API_URL environment variable is required for blog server functions',
  ) {
    super(message);
  }
}

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
