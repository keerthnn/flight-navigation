# Observability

## Health

`GET /api/health` returns simple service readiness:

```json
{
  "status": "ok",
  "service": "flight-navigation-backend",
  "timestamp": "..."
}
```

## Provider Status

`GET /api/providers` reports the configured provider mode and fallback posture for flight plans, weather, airports, fuel, and realtime simulation.

Use this endpoint in demos to explain why the app can run without paid keys while still being ready for real provider integration.

## Metrics

`GET /api/monitoring/metrics` exposes:

- HTTP request counts by method and status.
- Cache hits, misses, writes, and size.
- Provider success/fallback counters.
- WebSocket connection and message counters.
- Process uptime.

The current implementation is in-memory and suitable for local demos. Production deployments should export these counters to OpenTelemetry, Prometheus, Datadog, or another observability backend.

## Logs

The backend uses Pino and request IDs. In production, ship stdout logs to the hosting platform or a log pipeline and use the `x-request-id` header to trace support issues.
