/**
 * Fastify response envelope contract.
 *
 * Every JSON response from the backend follows the `{ code, message, data }`
 * envelope. Success is signalled by `code === '0000'`; non-success codes
 * map to the existing `ApiErrorTag` vocabulary in `./errors`.
 *
 * Server functions unwrap success envelopes to their `data` payload via
 * `parseEnvelope`. Anything that does not validate as a success envelope is
 * thrown as a typed `ResponseValidationError` so the failure is caught at
 * the contract boundary instead of leaking into the caller's data slot.
 */

import { z } from 'zod';

/**
 * Zod schema for the success-only Fastify envelope.
 *
 * The literal `'0000'` discriminator keeps the parser strict: a non-success
 * envelope never reaches the caller's `data` field, because `parseEnvelope`
 * refuses to accept it.
 */
export const successEnvelopeSchema = z.object({
  code: z.literal('0000'),
  message: z.string(),
  data: z.unknown(),
});

/** Loose envelope (success or error) for code that needs to inspect both. */
export const envelopeSchema = z.object({
  code: z.string(),
  message: z.string(),
  data: z.unknown(),
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
 * Thrown when a backend response fails schema validation.
 *
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

/**
 * Optional Zod schema for the envelope's `data` field. When provided,
 * `parseEnvelope` runs the schema against the parsed data and throws a
 * typed `ResponseValidationError` on mismatch.
 */
export type DataSchema<T> = z.ZodType<T>;

/**
 * Parse a backend JSON body as a success envelope and return its `data`.
 *
 * Throws `ResponseValidationError` for:
 *  - A non-success `code` (callers should route non-success bodies through
 *    `envelopeToApiError` instead of `parseEnvelope`).
 *  - A payload that fails the `successEnvelopeSchema` shape check.
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
