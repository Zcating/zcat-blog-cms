/**
 * Typed API error vocabulary and ResultCode -> ApiError conversion.
 *
 * This module is the single home of the `ApiError` / `ApiErrorTag`
 * types and the `mapResultCodeToTag` mapping. Server functions and
 * domain helpers convert a backend envelope with `envelopeToApiError`
 * so the envelope's `data` payload is never carried into the thrown
 * error.
 *
 * @see docs/adr/0002-effect-api-error-handling.md
 */

import { envelopeSchema } from './result';

/**
 * API error tag union, corresponding to backend ResultCode.
 * @see docs/adr/0002-effect-api-error-handling.md
 */
export type ApiErrorTag =
  | 'LoginError'
  | 'RegisterError'
  | 'DatabaseError'
  | 'UploadError'
  | 'ValidationError'
  | 'UnknownError';

/**
 * API error structure used as the failure channel of every server
 * function. All non-0000 responses from the backend are mapped to one
 * of these tags.
 */
export interface ApiError {
  readonly _tag: ApiErrorTag;
  readonly message: string;
}

/**
 * Maps backend ResultCode string to ApiErrorTag.
 * Returns null if code is '0000' (success).
 */
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
    default:
      return null;
  }
}

/**
 * Convert a backend envelope to a typed `ApiError`.
 *
 * Returns `null` for a success envelope (`code === '0000'`) so callers
 * can branch with a single check:
 *
 *   const apiError = envelopeToApiError(body);
 *   if (apiError) throw apiError;
 *
 * Unknown ResultCodes collapse to `UnknownError`. The envelope `data`
 * field is intentionally dropped — never put sensitive or domain data on
 * the error object.
 */
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
