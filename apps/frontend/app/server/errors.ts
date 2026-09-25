/**
 * Typed API error vocabulary and ResultCode -> ApiError conversion.
 *
 * Re-exports the legacy `ApiError` / `ApiErrorTag` types and
 * `mapResultCodeToTag` mapping verbatim so existing imports keep
 * compiling until the Phase 4 teardown. New server-side code should use
 * `envelopeToApiError` instead so the envelope's `data` payload is never
 * carried into the thrown error.
 *
 * @see apps/frontend/app/api/errors.ts (legacy home)
 * @see docs/adr/0002-effect-api-error-handling.md
 */

export {
  type ApiError,
  type ApiErrorTag,
  mapResultCodeToTag,
} from '@cms/api/errors';

import { type ApiError, mapResultCodeToTag } from '@cms/api/errors';

import { envelopeSchema } from './result';

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
