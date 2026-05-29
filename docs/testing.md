# Testing

## Backend

- Unit tests cover fuel estimation, weather risk scoring, and generated flight plans.
- Integration tests cover health, airport search, fallback flight-plan APIs, provider status, metrics, and WebSocket simulation.
- Provider contract tests use mock providers in `Backend/src/mocks`.
- Run with `cd Backend && npm test`.

## Frontend

- Vitest and React Testing Library cover the route planning dashboard.
- Mock fixtures live in `Frontend/src/mocks`.
- Tests cover route planning, app store behavior, and socket-frame handling.
- Playwright covers the search-to-detail smoke flow.

## CI

The GitHub Actions workflow installs, typechecks, tests, and builds both apps.
It also runs dependency audit checks and frontend Playwright e2e tests.
