# Architecture

## Frontend

`Frontend/src` is organized by responsibility:

- `app`: router, providers, and application shell.
- `features`: route search and flight detail workflows.
- `components`: reusable layout, map, chart, UI, and feedback components.
- `services/api`: typed HTTP gateway to the backend.
- `services/realtime`: WebSocket gateway for selected-aircraft live telemetry, with polling fallback.
- `hooks`: reusable state helpers such as debouncing and async execution.
- `store`: typed client state for selected airports, recent searches, provider status, and active route session.
- `mocks`: deterministic fixtures for UI tests and local contract examples.
- `constants` and `lib`: shared constants and browser-safe infrastructure helpers.
- `types`: shared aviation domain contracts.
- `config`: browser-safe runtime configuration.
- `utils`: formatting and pure helpers.
- `styles`: design tokens and responsive dashboard styling.
- `tests`: test setup and utilities.

The browser never calls third-party aviation or weather providers directly.

## Backend

`Backend/src` is layered:

- `routes`: version-ready HTTP route composition.
- `controllers`: request/response handling only.
- `services`: orchestration across providers, repositories, cache, and business rules.
- `providers`: external API adapters behind stable interfaces.
- `repositories`: data sources such as airport CSV seed data.
- `validators`: Zod request schemas.
- `middlewares`: request context, rate limiting, errors, logging, and security.
- `cache`: in-memory TTL cache with a Redis-ready boundary.
- `utils`: retry, route math, and error helpers.
- `websocket`: route simulation gateway.
- `monitoring`: health-adjacent metrics and provider counters.
- `jobs`: scheduled-job boundaries such as future airport refresh.
- `schemas`: shared non-HTTP validation schemas.
- `providers/flightTrackingProvider.ts`: free active-aircraft tracking adapter with OpenSky, ADSB.lol, selected-flight detail, track metadata, and mock fallback.

This keeps external APIs replaceable and business behavior testable.
