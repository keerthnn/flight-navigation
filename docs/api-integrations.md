# API Integration Guide

## Flight Plans

Current adapter: `Backend/src/providers/flightPlanProvider.ts`.

- Optional live provider: Flight Plan Database.
- Env: `FLIGHT_PLAN_DB_API_KEY`, `FLIGHT_PLAN_DB_BASE_URL`.
- Fallback: generated great-circle routes between seeded airports.
- Security: key is sent only from the backend using Basic auth.
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
- Local data: the bundled CSV keeps airport search usable without a database.

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

## Live Flight Tracking

Current live flight provider: `Backend/src/providers/flightTrackingProvider.ts`.

- Endpoint: `GET /api/flightplan/:id/active-flights?radiusKm=150&limit=25`.
- Route-first endpoint: `GET /api/routes/:routeId/active-flights?radiusKm=150&limit=25`.
- Selected flight detail: `GET /api/flights/:provider/:flightId?routeId=<routeId>`.
- Track endpoint: `GET /api/flights/:provider/:flightId/track`.
- Live stream: `WS /ws/flights/:provider/:flightId/live?routeId=<routeId>`.
- Provider order: OpenSky `/states/all` bounding box, ADSB.lol `/v2/point/{lat}/{lon}/{radius}`, then an empty demo-labeled fallback response.
- Env: `OPENSKY_BASE_URL`, `ADSB_LOL_BASE_URL`, `FLIGHT_TRACKING_MODE=auto|mock`.
- OpenSky terms: free REST use is intended for non-profit research/education; operational or commercial use requires a written license.
- ADSB.lol terms: free/open-source API, but production users should contact the project and future API keys may be required.
- Frontend rendering: `Frontend/src/components/maps/RouteMap.tsx` overlays active aircraft as traffic markers.

The old route animation socket remains only as demo fallback infrastructure. It is not part of the default flight-tracking experience.

## Route Optimization

No live route-optimization provider is hardcoded.

- Recommended adapter boundary: add `Backend/src/providers/routeOptimizationProvider.ts`.
- Free/open-source options to evaluate: self-hosted GraphHopper, OSRM, or Valhalla.
- Avoid depending on public demo routing servers for production traffic.

## Local Development Without Keys

Backend provider fallbacks keep the app usable without external keys. Live-flight discovery returns real provider data when OpenSky or ADSB.lol respond, and otherwise returns an empty demo-labeled response instead of fabricated traffic.
