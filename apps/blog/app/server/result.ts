import { z } from 'zod';

export const successEnvelopeSchema = z.object({
  code: z.literal('0000'),
  message: z.string(),
  data: z.unknown(),
});

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
