# Interview Notes

## Architecture Story

This project was refactored from a direct-API React/Express app into an aviation intelligence platform with typed boundaries:

- React feature modules for route search and route intelligence.
- Express controllers that only handle HTTP.
- Services that orchestrate business workflows.
- Provider interfaces that isolate external APIs.
- Repository abstractions for airport data.
- Cache, retry, validation, rate limiting, logging, metrics, and WebSocket simulation as infrastructure concerns.

## Tradeoffs

- Kept deterministic fallbacks because free aviation APIs can be rate-limited or unavailable during demos.
- Did not add auth/RBAC in this pass because route intelligence quality and provider boundaries are more relevant to the current product.
- Used in-memory cache/metrics for simplicity; Redis and OpenTelemetry are the next production steps.
- Kept OSM tiles as a development default only; production should use a compliant tile service or self-hosting.

## Senior Talking Points

- Secrets never leave the backend.
- External API churn is contained in provider adapters.
- The frontend can continue working when live-flight sockets fail because selected aircraft detail falls back to 10-second polling.
- The active-flight layer uses OpenSky/ADSB.lol only through backend adapters, preserving free demo behavior and clean replacement boundaries.
- The app has CI-grade validation: typecheck, unit tests, integration tests, build, audit, and Playwright smoke coverage.
- The structure supports future auth, persistence, analytics, and live aircraft providers without rewriting the core route flow.
