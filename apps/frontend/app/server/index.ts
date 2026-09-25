/**
 * Shared server-boundary barrel for the TanStack Start migration.
 *
 * Phase 2a exports the typed Fastify envelope, the env + Cookie
 * primitives, the explicit-operation transport, and the protected-function
 * middleware. Domain modules (`app/server/<domain>`) re-export from
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
  postAuthorizedJson,
  postJson,
  responseValidationError as transportResponseValidationError,
} from './transport';
export type { BackendEnv, FetchLike } from './transport';

export {
  createProtectedFunctionMiddleware,
  runProtectedFunctionGate,
  UnauthorizedError,
} from './auth-middleware';
export type { ProtectedFunctionContext } from './auth-middleware';
