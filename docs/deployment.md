# Deployment

## Frontend

Build with:

```sh
cd Frontend
npm run build
```

Deploy `Frontend/dist` to static hosting. Set `VITE_API_BASE_URL` at build time to the backend URL.

## Backend

Build with:

```sh
cd Backend
npm run build
npm start
```

Required production settings:

- `NODE_ENV=production`
- `PORT`
- `CORS_ORIGINS`
- Optional provider keys and base URLs
- Rate limit and cache TTL settings
- `VITE_WS_BASE_URL` should point to the backend WebSocket route when the frontend is built.

## Scaling Notes

- Put the backend behind a managed load balancer.
- Move cache from in-memory to Redis when multiple backend instances run.
- Store imported airport data in Postgres or Elasticsearch for richer search.
- Add provider-level circuit breakers and metrics before high traffic.
- Export monitoring counters through OpenTelemetry or Prometheus.
- Run WebSocket workloads on infrastructure that supports sticky connections or an external pub/sub layer.
