import { describe, expect, it } from 'vitest';

import { SSEDecoder } from './sse-decoder';

describe('SSEDecoder', () => {
  it('decodes a data-only SSE event', () => {
    const decoder = new SSEDecoder();
    expect(decoder.decode('data: hello')).toBeNull();
    const event = decoder.decode('');
    expect(event).not.toBeNull();
    expect(event!.data).toBe('hello');
    expect(event!.event).toBeNull();
  });

  it('decodes an event with named event type', () => {
    const decoder = new SSEDecoder();
    decoder.decode('event: done');
    decoder.decode('data: finished');
    const event = decoder.decode('');
    expect(event!.event).toBe('done');
    expect(event!.data).toBe('finished');
  });

  it('ignores comment lines starting with :', () => {
    const decoder = new SSEDecoder();
    expect(decoder.decode(':comment')).toBeNull();
    expect(decoder.decode('data: real')).toBeNull();
    const event = decoder.decode('');
    expect(event!.data).toBe('real');
  });

  // Per SSE spec: only ONE space after colon is stripped
  it('strips exactly one leading space from values', () => {
    const decoder = new SSEDecoder();
    decoder.decode('data: spaced value');
    const event = decoder.decode('');
    expect(event!.data).toBe('spaced value');
  });

  it('strips exactly one space even with multiple spaces after colon', () => {
    const decoder = new SSEDecoder();
    decoder.decode('data:  double space');
    const event = decoder.decode('');
    expect(event!.data).toBe(' double space'); // only first space stripped
  });

  it('handles multi-line data', () => {
    const decoder = new SSEDecoder();
    decoder.decode('data: line1');
    decoder.decode('data: line2');
    const event = decoder.decode('');
    expect(event!.data).toBe('line1\nline2');
  });

  it('strips trailing \\r from lines', () => {
    const decoder = new SSEDecoder();
    const event = decoder.decode('data: foo\r');
    expect(event).toBeNull();
  });

  it('returns null for empty decoder state', () => {
    const decoder = new SSEDecoder();
    expect(decoder.decode('')).toBeNull();
  });
});
