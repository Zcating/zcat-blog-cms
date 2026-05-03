interface CacheEntry<T> {
  value: T;
  deadline: number;
}

interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
}

export function createCache<T>(options: CacheOptions = {}) {
  const { maxSize = 100, defaultTtl = 0 } = options;
  const cache = new Map<string, CacheEntry<T>>();

  function getNow(): number {
    return Date.now();
  }

  function isExpired(entry: CacheEntry<T>): boolean {
    return entry.deadline !== 0 && entry.deadline <= getNow();
  }

  function cleanExpired(): number {
    const now = getNow();
    for (const [key, entry] of cache) {
      if (entry.deadline !== 0 && entry.deadline <= now) {
        cache.delete(key);
      }
    }
    return cache.size;
  }

  function evictLRU(limit: number): void {
    if (cache.size <= limit) {
      return;
    }
    let countToDelete = cache.size - limit;
    const keysToDelete: string[] = [];

    for (const key of cache.keys()) {
      if (countToDelete <= 0) {
        break;
      }
      keysToDelete.push(key);
      countToDelete--;
    }

    for (const key of keysToDelete) {
      cache.delete(key);
    }
  }

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry) {
        return undefined;
      }
      if (isExpired(entry)) {
        cache.delete(key);
        return undefined;
      }
      cache.delete(key);
      cache.set(key, entry);
      return entry.value;
    },

    set(key: string, value: T, options?: { ttl?: number }): void {
      const ttl = options?.ttl ?? defaultTtl;
      const deadline = ttl > 0 ? getNow() + ttl : 0;

      if (cache.has(key)) {
        cache.delete(key);
      }
      cache.set(key, { value, deadline });
      cleanExpired();
      evictLRU(maxSize);
    },

    clear(): void {
      cache.clear();
    },

    get size(): number {
      cleanExpired();
      return cache.size;
    },
  };
}
