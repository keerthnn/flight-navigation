"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = exports.MemoryCache = void 0;
const metrics_1 = require("../monitoring/metrics");
class MemoryCache {
    store = new Map();
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            metrics_1.metrics.recordCacheMiss();
            return undefined;
        }
        if (entry.expiresAt < Date.now()) {
            this.store.delete(key);
            metrics_1.metrics.recordCacheMiss();
            return undefined;
        }
        metrics_1.metrics.recordCacheHit();
        return entry.value;
    }
    set(key, value, ttlSeconds) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
        metrics_1.metrics.recordCacheWrite();
    }
    size() {
        return this.store.size;
    }
    wrap(key, ttlSeconds, factory) {
        const cached = this.get(key);
        if (cached !== undefined)
            return Promise.resolve(cached);
        return factory().then((value) => {
            this.set(key, value, ttlSeconds);
            return value;
        });
    }
}
exports.MemoryCache = MemoryCache;
exports.cache = new MemoryCache();
