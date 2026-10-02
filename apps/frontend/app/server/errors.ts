/*
 * Server functions and domain helpers convert a backend envelope with
 * `envelopeToApiError`, which drops the envelope's `data` payload so it can
 * never reach the thrown error.
 */

import { envelopeSchema } from './result';

export type ApiErrorTag =
  | 'LoginError'
  | 'RegisterError'
  | 'DatabaseError'
  | 'UploadError'
  | 'ValidationError'
  | 'NotFound'
  | 'UnknownError';

export interface ApiError {
  readonly _tag: ApiErrorTag;
  readonly message: string;
}

export function mapResultCodeToTag(code: string): ApiErrorTag | null {
  switch (code) {
    case 'ERR0001':
      return 'RegisterError';
    case 'ERR0002':
      return 'LoginError';
    case 'ERR0003':
      return 'DatabaseError';
    case 'ERR0004':
      return 'UploadError';
    case 'ERR0005':
      return 'ValidationError';
    case 'ERR0006':
      return 'UnknownError';
    case 'ERR0007':
      return 'NotFound';
    default:
      return null;
  }
}

/**
 * The transport throws the plain `ApiError` object, not an `Error`. Only
 * `ERR0007` is an absence — `ERR0002` is "not allowed" and `ERR0003` /
 * `ERR0006` are genuine faults, so none of them may classify as not-found.
 */
export function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { _tag?: unknown })._tag === 'NotFound'
  );
}

export function envelopeToApiError(payload: unknown): ApiError | null {
  const parsed = envelopeSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      _tag: 'UnknownError',
      message: 'Malformed error envelope from backend',
    };
  }
  const { code, message } = parsed.data;
  if (code === '0000') {
    return null;
  }
  const tag = mapResultCodeToTag(code);
  return {
    _tag: tag ?? 'UnknownError',
    message,
  };
}
