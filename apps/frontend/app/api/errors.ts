/**
 * API error tag union, corresponding to backend ResultCode.
 * @see docs/adr/0002-effect-api-error-handling.md
 * @see CONTEXT.md — API 响应码 (API Response Codes)
 */

export type ApiErrorTag =
  | 'LoginError'
  | 'RegisterError'
  | 'DatabaseError'
  | 'UploadError'
  | 'ValidationError'
  | 'UnknownError';

/**
 * API error structure used as Effect's failure channel.
 * All non-0000 responses from BFF are mapped to one of these tags.
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
