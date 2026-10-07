/**
 * Focused tests for the Fastify response envelope contract.
 *
 * The backend (Fastify) returns `{ code, message, data }`. Server functions
 * must:
 * 1. Unwrap a success envelope to its `data` payload.
 * 2. Reject a non-success envelope as a typed boundary error (no leakage
 *    into the caller's `data` slot).
 * 3. Reject a malformed success payload (failing Zod validation) with a
 *    typed boundary error that carries the original payload for diagnosis.
 *
 * These tests only exercise the pure schema/parsing layer. They do not
 * touch the network, TanStack Start internals, or shared helpers beyond
 * the module under test.
 */

import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  envelopeSchema,
  parseEnvelope,
  responseValidationError,
  successEnvelopeSchema,
  type Envelope,
  type ResponseValidationError,
} from './result';

const idObjectSchema = z.object({ id: z.number() });

describe('successEnvelopeSchema', () => {
  it('parses a success envelope with a data payload', () => {
    // `.parse` (not `.safeParse`) lets us assert on the typed result
    // directly without gating subsequent expects on a `success` flag.
    const parsed = successEnvelopeSchema.parse({
      code: '0000',
      message: 'ok',
      data: { id: 1, name: 'foo' },
    });
    expect(parsed.code).toBe('0000');
    expect(parsed.message).toBe('ok');
    expect(parsed.data).toEqual({ id: 1, name: 'foo' });
  });

  it('accepts an envelope with code 0000 and any data shape', () => {
    const parsed = successEnvelopeSchema.safeParse({
      code: '0000',
      message: 'ok',
      data: null,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects an envelope with a non-0000 code', () => {
    const parsed = successEnvelopeSchema.safeParse({
      code: 'ERR0002',
      message: 'login failed',
      data: null,
    });
    expect(parsed.success).toBe(false);
  });

  it('rejects an envelope with a missing message', () => {
    const parsed = successEnvelopeSchema.safeParse({
      code: '0000',
      data: { id: 1 },
    });
    expect(parsed.success).toBe(false);
  });
});

describe('envelopeSchema', () => {
  it('accepts the backend auth middleware 401 body, which carries no data key', () => {
    // apps/backend/src/middleware/auth.ts:21,35,44
    //   c.json({ code: 'ERR0002', message: 'Unauthorized' }, 401)
    // Round-tripped through JSON so the payload is the exact wire body.
    const parsed = envelopeSchema.safeParse(
      JSON.parse(JSON.stringify({ code: 'ERR0002', message: 'Unauthorized' })),
    );
    expect(parsed.success).toBe(true);
  });

  it('accepts a success envelope that does carry data', () => {
    const parsed = envelopeSchema.safeParse({
      code: '0000',
      message: 'ok',
      data: { id: 1 },
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a body with no message', () => {
    const parsed = envelopeSchema.safeParse({ code: 'ERR0002' });
    expect(parsed.success).toBe(false);
  });

  it('rejects a non-0000 envelope with or without a data key', () => {
    // This is the property that `data` being mandatory used to be
    // credited with: a non-success body must never reach a caller's
    // data slot. It is actually enforced by `code: z.literal('0000')`,
    // so it has to be asserted against BOTH wire shapes — the backend
    // omits `data` whenever the result is void and always includes it
    // otherwise. Asserting only the data-present shape would still pass
    // a schema that accepted an error envelope carrying a payload.
    const withoutData = successEnvelopeSchema.safeParse({
      code: 'ERR0007',
      message: 'photo not found',
    });
    const withData = successEnvelopeSchema.safeParse({
      code: 'ERR0007',
      message: 'photo not found',
      data: { id: 42 },
    });

    expect(withoutData.success).toBe(false);
    expect(withData.success).toBe(false);
  });
});

describe('successEnvelopeSchema (void success bodies)', () => {
  it('accepts the real wire body of a void success, which omits data', () => {
    // apps/backend `ResultData<T>` types `data?: T`, so `JSON.stringify`
    // drops the key entirely for every void endpoint (delete photo,
    // delete album, set cover, assign photos). Round-tripped through JSON
    // so this is the exact bytes the transport receives. Before `data`
    // became optional this rejected every one of them, which is what
    // made a successful delete roll its own row back into the cache.
    const parsed = successEnvelopeSchema.safeParse(
      JSON.parse(JSON.stringify({ code: '0000', message: '删除成功' })),
    );
    expect(parsed.success).toBe(true);
  });
});

describe('parseEnvelope', () => {
  it('unwraps a valid success envelope and returns its data', () => {
    const result = parseEnvelope<{ id: number }>({
      code: '0000',
      message: 'ok',
      data: { id: 42 },
    });
    expect(result).toEqual({ id: 42 });
  });

  it('throws a typed ResponseValidationError for a malformed success payload', () => {
    // Backend accidentally returned `data` as a JSON string instead of object.
    const caught = catchThrown<ResponseValidationError>(() =>
      parseEnvelope<{ id: number }>(
        {
          code: '0000',
          message: 'ok',
          data: '{"id":42}',
        },
        idObjectSchema,
      ),
    );

    expect(caught).toBeInstanceOf(Error);
    expect(caught.name).toBe('ResponseValidationError');
    expect(caught.code).toBe('ResponseValidationError');
    expect(caught.message).toContain(
      'Response envelope failed schema validation',
    );
    expect(caught.payload).toEqual({
      code: '0000',
      message: 'ok',
      data: '{"id":42}',
    });
    expect(Array.isArray(caught.issues)).toBe(true);
  });

  it('returns undefined for a void success body that omits data', () => {
    // The counterpart of the void-success case: this is the exact body
    // every void endpoint answers with, and it must NOT be treated as
    // malformed. A void caller passes no `dataSchema`, so there is
    // nothing left to validate and `undefined` is the honest result.
    const result = parseEnvelope<unknown>(
      JSON.parse(JSON.stringify({ code: '0000', message: '删除成功' })),
    );
    expect(result).toBeUndefined();
  });

  it('still throws when a dataSchema rejects an omitted payload', () => {
    // Making the KEY optional must not make a required payload
    // acceptable: a caller that declares a `dataSchema` is asking for a
    // payload, so a void body is a contract violation for them.
    const caught = catchThrown<ResponseValidationError>(() =>
      parseEnvelope<{ id: number }>(
        { code: '0000', message: 'ok' } as unknown as Envelope<unknown>,
        idObjectSchema,
      ),
    );
    expect(caught.name).toBe('ResponseValidationError');
  });

  it('throws a typed ResponseValidationError when code is non-0000', () => {
    // parseEnvelope is typed as "success only" — a non-0000 code means the
    // caller forgot to route through error conversion and we must reject.
    const caught = catchThrown<ResponseValidationError>(() =>
      parseEnvelope<unknown>({
        code: 'ERR0002',
        message: 'login failed',
        data: null,
      }),
    );
    expect(caught.name).toBe('ResponseValidationError');
  });

  it('responseValidationError factory builds an Error with the expected fields', () => {
    const err = responseValidationError('boom', { foo: 'bar' }, [
      { path: 'data.id', message: 'expected number' },
    ]);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ResponseValidationError');
    expect(err.code).toBe('ResponseValidationError');
    expect(err.message).toBe('boom');
    expect(err.payload).toEqual({ foo: 'bar' });
    expect(err.issues).toEqual([
      { path: 'data.id', message: 'expected number' },
    ]);
  });
});

function catchThrown<T extends Error>(fn: () => unknown): T {
  try {
    fn();
  } catch (error) {
    return error as T;
  }
  throw new Error('Expected function to throw, but it did not.');
}
