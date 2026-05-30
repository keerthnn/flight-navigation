# Flight Navigation Intelligence Platform

Production-style aviation route planning dashboard built with React, Vite, TypeScript, Express, and provider abstractions for flight plans, aviation weather, airport data, and fuel estimation.

## What This Demonstrates

- Feature-based React architecture with a reusable design system, dashboard layout, typed API layer, route-level code splitting, dark/light theme, loading states, empty states, and accessible airport autocomplete.
- Modular Express backend with controllers, services, providers, repositories, validation, caching, retry, rate limiting, structured logging, CORS, health checks, WebSocket simulation, monitoring metrics, and centralized error handling.
- Safe provider strategy: live-free APIs where possible, optional keyed integrations, deterministic fallbacks for demos, and no browser-exposed API keys.
- Interview-ready engineering practices: TypeScript, Docker, CI workflow, API integration guide, deployment notes, and scaling roadmap.

## Quick Start

```sh
cd Backend
npm install
cp .env.example .env
npm run dev
```

```sh
cd Frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The backend runs on `http://localhost:5001`.

## Core Flows

- Search airports from the bundled airport dataset.
- Search flight plans through the backend adapter.
- Use Flight Plan Database when `FLIGHT_PLAN_DB_API_KEY` is configured.
- Fall back to generated routes when live provider access is unavailable.
- Inspect route corridor, active aircraft near that corridor, weather impact, fuel estimate, emissions estimate, provider mode, selected-aircraft telemetry, and exportable JSON summary.
- Select a real/demo aircraft near the route. OpenSky is tried first, ADSB.lol is the fallback, and clearly labeled demo traffic is used only when live data is unavailable or mock mode is enabled.

## Interview Walkthrough

1. The browser talks only to the backend API and WebSocket gateway; no third-party secrets or provider URLs are embedded in feature code.
2. The backend uses provider interfaces for flight plans, weather, airports, and fuel so deprecated or paid APIs can be replaced without rewriting controllers or UI.
3. Provider fallbacks keep the app stable when live-free APIs are rate-limited, unavailable, or require future keys.
4. Active flight tracking is isolated behind backend providers so the app can use free live networks without coupling React to third-party APIs.
5. Monitoring endpoints expose cache, provider fallback, HTTP request, and WebSocket counters for production-readiness conversations.
6. The frontend uses feature modules, shared UI primitives, a typed store, lazy-loaded pages, and a live-flight socket hook with polling fallback.
7. CI validates type safety, builds, and audit checks.

## Validation

```sh
cd Backend && npm run typecheck && npm run build
cd Frontend && npm run typecheck && npm run build
```

## Documentation

- [Architecture](docs/architecture.md)
- [API integrations](docs/api-integrations.md)
- [Deployment](docs/deployment.md)
- [Testing](docs/testing.md)
- [Observability](docs/observability.md)
- [Interview notes](docs/interview-notes.md)
- [Roadmap](docs/roadmap.md)

## Environment And Secrets

Never commit `.env` files. API keys belong only in backend environment variables. The frontend only receives `VITE_API_BASE_URL` and tile configuration.

## Docker

```sh
docker compose up --build
```

The compose setup starts backend and frontend containers for local production-style testing.
