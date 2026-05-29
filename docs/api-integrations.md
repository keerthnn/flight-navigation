# API Integration Guide

## Flight Plans

Current adapter: `Backend/src/providers/flightPlanProvider.ts`.

- Optional live provider: Flight Plan Database.
- Env: `FLIGHT_PLAN_DB_API_KEY`, `FLIGHT_PLAN_DB_BASE_URL`.
- Fallback: generated great-circle routes between seeded airports.
- Security: key is sent only from the backend using Basic auth.
- Mocking: use `Backend/src/mocks/mockProviders.ts` to test provider contracts without live calls.
- Local/CI deterministic mode: set `MOCK_PROVIDERS=true` in the backend environment.
- Scalability: cache route search and details; add provider-specific circuit breakers before production traffic.

## Aviation Weather

Current adapter: `Backend/src/providers/weatherProvider.ts`.

- Primary keyless provider: AviationWeather.gov METAR endpoint.
- Fallback keyless provider: Open-Meteo forecast endpoint.
- Final fallback: deterministic synthetic weather for offline demos.
- Limits: AviationWeather.gov asks clients to keep requests scoped and may rate-limit frequent requests. Its Data API also documents September 2025 schema changes, so keep response normalization isolated inside the provider.
- Open-Meteo: free access is non-commercial, rate-limited to 10,000 calls/day, and has no uptime guarantee. Use the commercial endpoint/key for production commercial deployments.
- Security: no weather API keys are sent to the browser; all weather calls are backend-only.

## Airport Data

Current repository: `Backend/src/repositories/airportRepository.ts`.

- Seed source: bundled `Frontend/public/iata-icao.csv`.
- Recommended production source: nightly OurAirports CSV import.
- Future improvement: scheduled job to refresh airport data into Postgres or Redis search.
- Mocking: `MockAirportRepository` supplies stable airport data for tests.

## Fuel

Current adapter: `Backend/src/providers/fuelProvider.ts`.

- Uses a deterministic local estimator by aircraft class.
- Replace with a verified provider later by implementing the `FuelProvider` interface.
- Do not restore unsupported fuel APIs unless terms and reliability are confirmed.

## Maps

Current frontend map component: `Frontend/src/components/maps/RouteMap.tsx`.

- Env: `VITE_TILE_URL`, `VITE_TILE_ATTRIBUTION`.
- Development default uses OpenStreetMap tiles.
- Production should use a compliant tile provider or self-hosted tiles.
- OSM public tiles are not production infrastructure for heavy traffic; configure a real tile provider before public launch.

## Realtime Flight Tracking

Current simulation gateway: `Backend/src/websocket/routeSimulation.ts`.

- URL: `ws://<backend-host>/ws/simulation?flightPlanId=<id>&aircraft=A320`.
- Frontend hook: `Frontend/src/hooks/useRouteSimulation.ts`.
- Fallback: local map animation if WebSocket connection fails or closes.
- Future live aircraft data: implement an OpenSky adapter behind a new provider interface and keep operational-use licensing constraints in deployment docs.

## Route Optimization

No live route-optimization provider is hardcoded.

- Recommended adapter boundary: add `Backend/src/providers/routeOptimizationProvider.ts`.
- Free/open-source options to evaluate: self-hosted GraphHopper, OSRM, or Valhalla.
- Avoid depending on public demo routing servers for production traffic.

## Mocking

- Backend provider fallbacks keep the app usable without external keys.
- Frontend tests should mock `services/api/flightApi`.
- Backend provider contract tests should mock HTTP responses and never hit live providers in CI.
