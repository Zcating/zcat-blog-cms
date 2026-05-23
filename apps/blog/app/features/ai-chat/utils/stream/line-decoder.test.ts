import { describe, expect, it } from 'vitest';

import { LineDecoder, findDoubleNewlineIndex } from './line-decoder';

describe('LineDecoder', () => {
  it('decodes a single line ending with \n', () => {
    const decoder = new LineDecoder();
    const lines = decoder.decode('hello\n');
    expect(lines).toEqual(['hello']);
  });

  it('decodes a single line ending with \r\n', () => {
    const decoder = new LineDecoder();
    const lines = decoder.decode('hello\r\n');
    expect(lines).toEqual(['hello']);
  });

  it('accumulates partial data across chunks', () => {
    const decoder = new LineDecoder();
    expect(decoder.decode('hel')).toEqual([]);
    expect(decoder.decode('lo\nworld\n')).toEqual(['hello', 'world']);
  });

  it('handles empty chunk', () => {
    const decoder = new LineDecoder();
    expect(decoder.decode(null)).toEqual([]);
  });

  it('handles multiple lines in a single chunk', () => {
    const decoder = new LineDecoder();
    const lines = decoder.decode('a\nb\nc\n');
    expect(lines).toEqual(['a', 'b', 'c']);
  });

  it('flushes remaining data', () => {
    const decoder = new LineDecoder();
    decoder.decode('hello');
    expect(decoder.flush()).toEqual(['hello']);
  });

  it('flush returns empty when buffer is empty', () => {
    const decoder = new LineDecoder();
    expect(decoder.flush()).toEqual([]);
  });

  it('handles Uint8Array input', () => {
    const decoder = new LineDecoder();
    const encoder = new TextEncoder();
    const lines = decoder.decode(encoder.encode('test\n'));
    expect(lines).toEqual(['test']);
  });

  it('handles ArrayBuffer input', () => {
    const decoder = new LineDecoder();
    const arr = new Uint8Array([104, 105, 10]); // 'hi\n'
    const buf = arr.buffer.slice(0);
    const lines = decoder.decode(buf);
    expect(lines).toEqual(['hi']);
  });
});

describe('findDoubleNewlineIndex', () => {
  it('finds \n\n', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('hello\n\nworld');
    expect(findDoubleNewlineIndex(buf)).toBe(7);
  });

  it('finds \r\r', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('hello\r\rworld');
    expect(findDoubleNewlineIndex(buf)).toBe(7);
  });

  it('finds \r\n\r\n', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('hello\r\n\r\nworld');
    expect(findDoubleNewlineIndex(buf)).toBe(9);
  });

  it('returns -1 when no pattern found', () => {
    const encoder = new TextEncoder();
    const buf = encoder.encode('hello\nworld');
    expect(findDoubleNewlineIndex(buf)).toBe(-1);
  });
});
