/*
 * Success is signalled by `code === '0000'`; non-success codes map to the
 * existing `ApiErrorTag` vocabulary in `./errors`.
 *
 * Server functions unwrap success envelopes to their `data` payload via
 * `parseEnvelope`. Anything that does not validate as a success envelope is
 * thrown as a typed `ResponseValidationError` so the failure is caught at
 * the contract boundary instead of leaking into the caller's data slot.
 */

import { z } from 'zod';

/**
 * The literal `'0000'` discriminator keeps the parser strict: a non-success
 * envelope never reaches the caller's `data` field.
 */
export const successEnvelopeSchema = z.object({
  code: z.literal('0000'),
  message: z.string(),
  data: z.unknown(),
});

/**
 * Loose envelope (success or error) for code that needs to inspect both.
 *
 * `data` is OPTIONAL here, unlike in `successEnvelopeSchema`. The backend's
 * auth middleware answers a rejected token with a literal
 * `{ code, message }` pair and `createResult` drops an absent `data` when
 * `JSON.stringify` runs, so a real error envelope has no `data` key at all.
 * Requiring the key made every such envelope parse as malformed and turned
 * an expired session into an `UnknownError`.
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
