/*
 * Success is signalled by `code === '0000'`; non-success codes map to the
 * `ApiErrorTag` vocabulary in `./errors`. `parseEnvelope` unwraps a success
 * envelope to its `data` payload and throws a typed `ResponseValidationError`
 * otherwise, so a contract failure is caught here instead of leaking into the
 * caller's data slot.
 */

import { z } from 'zod';

export const successEnvelopeSchema = z.object({
  code: z.literal('0000'),
  message: z.string(),
  /**
   * `data` is OPTIONAL, and the backend really does omit the key:
   * `ResultData<T>` declares `data?: T`, so a void result (every DELETE
   * plus the "set cover" / "assign photos" endpoints) is serialised as a
   * literal `{ code, message }` pair. Requiring the key made every such
   * response parse as malformed, rejected the mutation, and rolled the
   * row the server had already deleted straight back into the cache.
   *
   * The invariant that actually keeps a non-success body out of a
   * caller's data slot is `code: z.literal('0000')` above, NOT key
   * presence — a non-`0000` envelope is rejected either way.
   */
  data: z.unknown().optional(),
});

/**
 * `data` is optional for the same reason as in `successEnvelopeSchema`,
 * and the backend's auth middleware additionally answers a rejected
 * token with a literal `{ code, message }` pair, so a real error
 * envelope has no `data` key at all.
 */
export const envelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.unknown().optional(),
});

export type Envelope<T> = {
  code: string;
  message: string;
  data: T;
};

export type EnvelopeIssue = {
  path: string;
  message: string;
};

/**
 * Carries the original payload and the Zod issues so callers can log a
 * structured failure without re-parsing the body.
 */
export class ResponseValidationError extends Error {
  readonly code = 'ResponseValidationError';
  readonly name = 'ResponseValidationError';
  readonly payload: unknown;
  readonly issues: ReadonlyArray<EnvelopeIssue>;

  constructor(
    message: string,
    payload: unknown,
    issues: ReadonlyArray<EnvelopeIssue> = [],
  ) {
    super(message);
    this.payload = payload;
    this.issues = issues;
  }
}

export function responseValidationError(
  message: string,
  payload: unknown,
  issues: ReadonlyArray<EnvelopeIssue> = [],
): ResponseValidationError {
  return new ResponseValidationError(message, payload, issues);
}

export type DataSchema<T> = z.ZodType<T>;

/**
 * Throws `ResponseValidationError` for:
 *  - A non-success `code` (callers should route non-success bodies through
 *    `envelopeToApiError` instead of `parseEnvelope`).
 *  - When a `dataSchema` is provided, a `data` field that does not match
 *    the schema (e.g. backend accidentally returned `data` as a JSON
 *    string instead of the expected object).
 */
export function parseEnvelope<T>(
  payload: unknown,
  dataSchema?: DataSchema<T>,
): T {
  const parsed = successEnvelopeSchema.safeParse(payload);
  if (!parsed.success) {
    throw responseValidationError(
      'Response envelope failed schema validation',
      payload,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }

  if (!dataSchema) {
    return parsed.data.data as T;
  }

  const dataParsed = dataSchema.safeParse(parsed.data.data);
  if (!dataParsed.success) {
    throw responseValidationError(
      'Response envelope failed schema validation',
      payload,
      dataParsed.error.issues.map((issue) => ({
        path: `data.${issue.path.join('.')}`,
        message: issue.message,
      })),
    );
  }
  return dataParsed.data;
}
