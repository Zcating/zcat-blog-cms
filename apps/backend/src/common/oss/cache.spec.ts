import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createCache } from './cache';

describe('createCache 闭包缓存', () => {
  let now: number;
  let dateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    now = 1_000_000_000 * 1000;
    dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    dateSpy.mockRestore();
  });

  function advanceMs(ms: number) {
    now += ms;
    dateSpy.mockImplementation(() => now);
  }

  describe('set 存储', () => {
    it('should store value with optional ttl', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should store value with custom ttl', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1', { ttl: 60 });
      expect(cache.get('key1')).toBe('value1');
    });

    it('should replace existing value for same key', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'old');
      cache.set('key1', 'new');
      expect(cache.get('key1')).toBe('new');
    });
  });

  describe('get 获取', () => {
    it('should retrieve stored value', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing key', () => {
      const cache = createCache<string>({ maxSize: 10 });
      expect(cache.get('nonexistent')).toBeUndefined();
    });
  });

  describe('过期自动删除 (ttl)', () => {
    it('should delete expired entries on get', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1', { ttl: 10 });
      advanceMs(11);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not delete entries within ttl', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1', { ttl: 60 });
      advanceMs(59);
      expect(cache.get('key1')).toBe('value1');
    });

    it('should use default ttl when not specified', () => {
      const cache = createCache<string>({ maxSize: 10, defaultTtl: 30 });
      cache.set('key1', 'value1');
      advanceMs(31);
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('LRU 驱逐策略', () => {
    it('should evict oldest entry when over max size', () => {
      const cache = createCache<string>({ maxSize: 2 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should update access order on get (LRU)', () => {
      const cache = createCache<string>({ maxSize: 2 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.get('key1');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
    });

    it('should update access order on set (LRU)', () => {
      const cache = createCache<string>({ maxSize: 2 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key1', 'value1-updated');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBe('value1-updated');
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBe('value3');
    });

    it('should evict expired entries before LRU eviction', () => {
      const cache = createCache<string>({ maxSize: 2 });
      cache.set('key1', 'value1', { ttl: 5 });
      advanceMs(6);
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
    });

    it('should handle 0 max size gracefully', () => {
      const cache = createCache<string>({ maxSize: 0 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBeUndefined();
    });
  });

  describe('clear 清除', () => {
    it('should clear all entries', () => {
      const cache = createCache<string>({ maxSize: 10 });
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });
  });
});
