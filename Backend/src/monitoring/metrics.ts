export interface MetricsSnapshot {
  uptimeSeconds: number;
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
  };
  cache: {
    hits: number;
    misses: number;
    writes: number;
    size: number;
  };
  providers: {
    flightPlanDbSuccess: number;
    generatedFallback: number;
    aviationWeatherSuccess: number;
    openMeteoSuccess: number;
    syntheticWeatherFallback: number;
    localFuelEstimate: number;
  };
  websocket: {
    connections: number;
    activeConnections: number;
    messagesSent: number;
  };
}

const startedAt = Date.now();

const counters = {
  requestsTotal: 0,
  requestsByMethod: {} as Record<string, number>,
  requestsByStatus: {} as Record<string, number>,
  cacheHits: 0,
  cacheMisses: 0,
  cacheWrites: 0,
  flightPlanDbSuccess: 0,
  generatedFallback: 0,
  aviationWeatherSuccess: 0,
  openMeteoSuccess: 0,
  syntheticWeatherFallback: 0,
  localFuelEstimate: 0,
  websocketConnections: 0,
  websocketActiveConnections: 0,
  websocketMessagesSent: 0,
};

export const metrics = {
  recordRequest(method: string, statusCode: number): void {
    counters.requestsTotal += 1;
    counters.requestsByMethod[method] = (counters.requestsByMethod[method] ?? 0) + 1;
    const status = String(statusCode);
    counters.requestsByStatus[status] = (counters.requestsByStatus[status] ?? 0) + 1;
  },
  recordCacheHit(): void {
    counters.cacheHits += 1;
  },
  recordCacheMiss(): void {
    counters.cacheMisses += 1;
  },
  recordCacheWrite(): void {
    counters.cacheWrites += 1;
  },
  recordProviderEvent(event: keyof MetricsSnapshot['providers']): void {
    counters[event] += 1;
  },
  recordWebSocketConnect(): void {
    counters.websocketConnections += 1;
    counters.websocketActiveConnections += 1;
  },
  recordWebSocketDisconnect(): void {
    counters.websocketActiveConnections = Math.max(0, counters.websocketActiveConnections - 1);
  },
  recordWebSocketMessage(): void {
    counters.websocketMessagesSent += 1;
  },
  snapshot(cacheSize: number): MetricsSnapshot {
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
      },
      websocket: {
        connections: counters.websocketConnections,
        activeConnections: counters.websocketActiveConnections,
        messagesSent: counters.websocketMessagesSent,
      },
    };
  },
};
