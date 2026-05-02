/**
 * 简单的 TTL 缓存：每个 key 记录 value 与过期时间戳（秒）。
 *
 * 用于存储临时数据，如私有下载链接。支持以下特性：
 * - 按 key 设置过期时间（TTL）
 * - 提前刷新（refresh-ahead）机制，避免缓存击穿
 * - 超出容量上限时自动淘汰（FIFO）
 *
 * @template T 缓存值的类型
 */
export class Cache<T> {
  // 缓存数据结构：key -> { value, deadline }
  private readonly cache = new Map<string, { value: T; deadline: number }>();

  // 提前刷新时间（单位：秒），避免过期后立即请求导致缓存击穿。
  private readonly refreshAheadSeconds = 60;

  constructor(
    // 缓存上限（按 key 数量计），避免进程长期运行时无限增长。
    private readonly maxSize: number = 1000,
    // 过期时长（单位：秒）
    private readonly ttl: number = 60,
  ) {}

  get(key: string): T | undefined {
    const now = this.getCurrentSecond();
    const cached = this.cache.get(key);
    if (!cached) {
      return undefined;
    }

    if (now >= cached.deadline - this.refreshAheadSeconds) {
      this.cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  set(key: string, value: T) {
    const now = this.getCurrentSecond();
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, { value, deadline: now + this.ttl });

    if (this.cache.size <= this.maxSize) {
      return;
    }

    for (const [cacheKey, entry] of this.cache) {
      if (now >= entry.deadline - this.refreshAheadSeconds) {
        this.cache.delete(cacheKey);
      }
    }

    if (this.cache.size <= this.maxSize) {
      return;
    }

    const oldestKey = this.cache.keys().next();
    if (oldestKey.value) {
      this.cache.delete(oldestKey.value);
    }
  }

  private getCurrentSecond() {
    return Math.floor(Date.now() / 1000);
  }
}
