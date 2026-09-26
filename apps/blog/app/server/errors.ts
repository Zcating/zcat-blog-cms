import { envelopeSchema } from './result';

export type ApiErrorTag =
  | 'LoginError'
  | 'RegisterError'
  | 'DatabaseError'
  | 'UploadError'
  | 'ValidationError'
  | 'UnknownError';

export interface ApiError {
  readonly _tag: ApiErrorTag;
  readonly message: string;
}

export class ApiErrorException extends Error {
  readonly code = 'ApiErrorException';
  readonly name = 'ApiErrorException';
  readonly apiError: ApiError;

  constructor(apiError: ApiError) {
    super(apiError.message);
    this.apiError = apiError;
  }
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
    default:
      return null;
  }
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
