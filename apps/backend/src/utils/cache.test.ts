import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Cache } from './cache';

describe('Cache', () => {
  let now: number;
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    now = 1_000_000_000; // Fixed timestamp
    dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now * 1000);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  function advanceSeconds(seconds: number) {
    now += seconds;
    dateSpy.mockImplementation(() => now * 1000);
  }

  it('stores and retrieves a value', () => {
    const cache = new Cache<string>(10, 100);

    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns undefined for missing key', () => {
    const cache = new Cache<string>(10, 100);

    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('returns undefined for expired entries', () => {
    const cache = new Cache<string>(10, 100);

    cache.set('key1', 'value1');
    advanceSeconds(101); // Past TTL

    expect(cache.get('key1')).toBeUndefined();
  });

  it('returns value when within TTL (including near-expiry)', () => {
    const cache = new Cache<string>(10, 100);

    cache.set('key1', 'value1');
    advanceSeconds(99); // Just before TTL

    expect(cache.get('key1')).toBe('value1');
  });

  it('replaces existing value for same key on set', () => {
    const cache = new Cache<string>(10, 100);

    cache.set('key1', 'old');
    cache.set('key1', 'new');
    expect(cache.get('key1')).toBe('new');
  });

  it('evicts oldest entry when over max size', () => {
    const cache = new Cache<string>(2, 100); // Max 2 entries

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3'); // Should evict key1

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
  });

  it('evicts expired entries before evicting oldest', () => {
    const cache = new Cache<string>(2, 100);

    cache.set('key1', 'value1');
    advanceSeconds(101); // key1 is now expired

    cache.set('key2', 'value2');
    // key1 is expired, key2 is valid
    // Adding key3 should evict expired key1 first
    cache.set('key3', 'value3');

    expect(cache.get('key1')).toBeUndefined();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
  });

  it('handles cache with 0 max size', () => {
    const cache = new Cache<string>(0, 100);

    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBeUndefined();
  });
});
