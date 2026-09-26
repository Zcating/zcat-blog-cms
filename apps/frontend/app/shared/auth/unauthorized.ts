export const UNAUTHORIZED_ERROR_CODE = 'UnauthorizedError';

export const UNAUTHORIZED_ERROR_TAG = 'LoginError';

export function isUnauthorizedError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const candidate = error as {
    name?: unknown;
    code?: unknown;
    message?: unknown;
    _tag?: unknown;
  };
  return (
    candidate.name === UNAUTHORIZED_ERROR_CODE ||
    candidate.code === UNAUTHORIZED_ERROR_CODE ||
    candidate.message === UNAUTHORIZED_ERROR_CODE ||
    candidate._tag === UNAUTHORIZED_ERROR_TAG
  );
}
