/*
 * Domain modules (`app/server/<domain>`) re-export from
 * here; feature pages and route files do NOT import from this barrel
 * directly — they go through the domain modules.
 */

export {
  envelopeSchema,
  parseEnvelope,
  responseValidationError,
  successEnvelopeSchema,
  ResponseValidationError,
} from './result';
export type { Envelope, EnvelopeIssue } from './result';

export { envelopeToApiError, mapResultCodeToTag } from './errors';
export type { ApiError, ApiErrorTag } from './errors';

export { BackendUrlMissingError, resolveBackendApiUrl } from './env';

export {
  authorizeFromCookie,
  buildAuthorizationHeader,
  clearSessionCookie,
  liveCookieIO,
  parseSessionCookie,
  setSessionCookie,
  TOKEN_COOKIE_NAME,
} from './cookies';
export type { CookieIO } from './cookies';

export {
  deleteAuthorized,
  getAuthorizedJson,
  postAuthorizedJson,
  postJson,
  responseValidationError as transportResponseValidationError,
} from './transport';
export type { BackendEnv, FetchLike } from './transport';

export {
  createProtectedFunctionMiddleware,
  UnauthorizedError,
} from './auth-middleware';
export type { ProtectedFunctionContext } from './auth-middleware';
// `runProtectedFunctionGate` is a server-only test seam. It lives in
// `auth-middleware.server.ts` and is NOT re-exported through the
// public barrel — domain code MUST use `createProtectedFunctionMiddleware`
// instead. Tests reach for the file directly.
export type { MiddlewareServerInput } from './auth-middleware.server';
