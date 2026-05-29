"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const memoryCache_1 = require("../cache/memoryCache");
const retry_1 = require("../utils/retry");
(0, vitest_1.describe)('cache and retry infrastructure', () => {
    (0, vitest_1.it)('wraps cache misses and returns cached values later', async () => {
        const cache = new memoryCache_1.MemoryCache();
        let calls = 0;
        const first = await cache.wrap('key', 60, async () => {
            calls += 1;
            return 'value';
        });
        const second = await cache.wrap('key', 60, async () => {
            calls += 1;
            return 'new-value';
        });
        (0, vitest_1.expect)(first).toBe('value');
        (0, vitest_1.expect)(second).toBe('value');
        (0, vitest_1.expect)(calls).toBe(1);
    });
    (0, vitest_1.it)('retries transient operations', async () => {
        let calls = 0;
        const result = await (0, retry_1.retry)(async () => {
            calls += 1;
            if (calls < 2)
                throw new Error('temporary');
            return 'ok';
        }, { initialDelayMs: 1, retries: 2 });
        (0, vitest_1.expect)(result).toBe('ok');
        (0, vitest_1.expect)(calls).toBe(2);
    });
});
