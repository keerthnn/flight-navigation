interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

import { metrics } from '../monitoring/metrics';

export class MemoryCache {
  private readonly store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      metrics.recordCacheMiss();
      return undefined;
    }
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key);
      metrics.recordCacheMiss();
      return undefined;
    }
    metrics.recordCacheHit();
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    metrics.recordCacheWrite();
  }

  size(): number {
    return this.store.size;
  }

  wrap<T>(key: string, ttlSeconds: number, factory: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return Promise.resolve(cached);
    return factory().then((value) => {
      this.set(key, value, ttlSeconds);
      return value;
    });
  }
}

export const cache = new MemoryCache();
