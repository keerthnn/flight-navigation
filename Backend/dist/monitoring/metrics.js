"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
const startedAt = Date.now();
const counters = {
    requestsTotal: 0,
    requestsByMethod: {},
    requestsByStatus: {},
    cacheHits: 0,
    cacheMisses: 0,
    cacheWrites: 0,
    flightPlanDbSuccess: 0,
    generatedFallback: 0,
    aviationWeatherSuccess: 0,
    openMeteoSuccess: 0,
    syntheticWeatherFallback: 0,
    localFuelEstimate: 0,
    openSkySuccess: 0,
    adsbLolSuccess: 0,
    flightTrackingMockFallback: 0,
    websocketConnections: 0,
    websocketActiveConnections: 0,
    websocketMessagesSent: 0,
};
exports.metrics = {
    recordRequest(method, statusCode) {
        counters.requestsTotal += 1;
        counters.requestsByMethod[method] = (counters.requestsByMethod[method] ?? 0) + 1;
        const status = String(statusCode);
        counters.requestsByStatus[status] = (counters.requestsByStatus[status] ?? 0) + 1;
    },
    recordCacheHit() {
        counters.cacheHits += 1;
    },
    recordCacheMiss() {
        counters.cacheMisses += 1;
    },
    recordCacheWrite() {
        counters.cacheWrites += 1;
    },
    recordProviderEvent(event) {
        counters[event] += 1;
    },
    recordWebSocketConnect() {
        counters.websocketConnections += 1;
        counters.websocketActiveConnections += 1;
    },
    recordWebSocketDisconnect() {
        counters.websocketActiveConnections = Math.max(0, counters.websocketActiveConnections - 1);
    },
    recordWebSocketMessage() {
        counters.websocketMessagesSent += 1;
    },
    snapshot(cacheSize) {
        return {
            uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
            requests: {
                total: counters.requestsTotal,
                byMethod: { ...counters.requestsByMethod },
                byStatus: { ...counters.requestsByStatus },
            },
            cache: {
                hits: counters.cacheHits,
                misses: counters.cacheMisses,
                writes: counters.cacheWrites,
                size: cacheSize,
            },
            providers: {
                flightPlanDbSuccess: counters.flightPlanDbSuccess,
                generatedFallback: counters.generatedFallback,
                aviationWeatherSuccess: counters.aviationWeatherSuccess,
                openMeteoSuccess: counters.openMeteoSuccess,
                syntheticWeatherFallback: counters.syntheticWeatherFallback,
                localFuelEstimate: counters.localFuelEstimate,
                openSkySuccess: counters.openSkySuccess,
                adsbLolSuccess: counters.adsbLolSuccess,
                flightTrackingMockFallback: counters.flightTrackingMockFallback,
            },
            websocket: {
                connections: counters.websocketConnections,
                activeConnections: counters.websocketActiveConnections,
                messagesSent: counters.websocketMessagesSent,
            },
        };
    },
};
