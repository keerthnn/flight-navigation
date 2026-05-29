import { describe, expect, it } from 'vitest';
import { MemoryCache } from '../cache/memoryCache';
import { retry } from '../utils/retry';

describe('cache and retry infrastructure', () => {
  it('wraps cache misses and returns cached values later', async () => {
    const cache = new MemoryCache();
    let calls = 0;

    const first = await cache.wrap('key', 60, async () => {
      calls += 1;
      return 'value';
    });
    const second = await cache.wrap('key', 60, async () => {
      calls += 1;
      return 'new-value';
    });

    expect(first).toBe('value');
    expect(second).toBe('value');
    expect(calls).toBe(1);
  });

  it('retries transient operations', async () => {
    let calls = 0;
    const result = await retry(
      async () => {
        calls += 1;
        if (calls < 2) throw new Error('temporary');
        return 'ok';
      },
      { initialDelayMs: 1, retries: 2 },
    );

    expect(result).toBe('ok');
    expect(calls).toBe(2);
  });
});
