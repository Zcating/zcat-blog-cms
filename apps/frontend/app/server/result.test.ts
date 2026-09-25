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

  it('throws a typed ResponseValidationError when data is missing', () => {
    const caught = catchThrown<ResponseValidationError>(() =>
      parseEnvelope<unknown>({
        code: '0000',
        message: 'ok',
      } as unknown as Envelope<unknown>),
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
