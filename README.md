# Flight Navigation Intelligence Platform

Production-style aviation route planning dashboard with a React + Vite frontend and a Next.js (Pages Router API) backend.

## Project Structure

- `Frontend` - React, Vite, TypeScript UI.
- `Backend` - Next.js API server, service/provider layers, caching, and integrations.

## Prerequisites

- Node.js `>= 20`
- npm `>= 10`
- Git

Check versions:

```sh
node -v
npm -v
```

## First-Time Setup (Fresh Clone)

1. Clone and open the project:

```sh
git clone <your-repo-url>
cd flight-navigation
```

2. Install backend dependencies:

```sh
cd Backend
npm install
```

3. Install frontend dependencies:

```sh
cd ../Frontend
npm install
```

4. Start backend (Terminal 1):

```sh
cd Backend
npm run dev
```

5. Start frontend (Terminal 2):

```sh
cd Frontend
npm run dev
```

6. Open the app:

- Frontend: `http://localhost:5173`
- Backend API base: `http://localhost:5001/api`

## Environment Files

Use only one environment file per app:

- `Backend/.env`
- `Frontend/.env`

Both `.env` files are part of this project setup. Update values as needed for your environment.

### Backend env reference (`Backend/.env`)

| Key | Required | Description | Example |
| --- | --- | --- | --- |
| `PORT` | Yes | Backend server port. | `5001` |
| `NODE_ENV` | Yes | Runtime mode. | `development` |
| `LOG_LEVEL` | Yes | Log verbosity level. | `info` |
| `CORS_ORIGINS` | Yes | Comma-separated allowed frontend origins. | `http://localhost:5173,http://localhost:3000` |
| `FLIGHT_PLAN_DB_API_KEY` | Optional | Flight Plan Database key. Leave empty to use generated fallback routes. | `` |
| `FLIGHT_PLAN_DB_BASE_URL` | Yes | Base URL for flight plan provider. | `https://api.flightplandatabase.com` |
| `AVIATION_WEATHER_BASE_URL` | Yes | Base URL for aviation weather provider. | `https://aviationweather.gov/api/data` |
| `OPEN_METEO_BASE_URL` | Yes | Base URL for Open-Meteo data. | `https://api.open-meteo.com/v1` |
| `OPENSKY_BASE_URL` | Yes | Base URL for OpenSky live traffic provider. | `https://opensky-network.org/api` |
| `ADSB_LOL_BASE_URL` | Yes | Base URL for ADSB.lol fallback traffic provider. | `https://api.adsb.lol` |
| `FLIGHT_TRACKING_MODE` | Yes | `auto` uses live + fallback, `mock` forces mock traffic. | `auto` |
| `AIRPORT_CSV_PATH` | Yes | Path to airport CSV used by backend airport repository. | `../Frontend/public/iata-icao.csv` |
| `CACHE_TTL_SECONDS` | Yes | Cache time-to-live in seconds. | `300` |
| `RATE_LIMIT_WINDOW_MS` | Yes | Rate limit window duration in milliseconds. | `60000` |
| `RATE_LIMIT_MAX` | Yes | Max requests allowed per rate limit window. | `120` |
| `API_KEY` | Yes | Project-specific backend key used by your app logic. | `<your-key>` |

### Frontend env reference (`Frontend/.env`)

| Key | Required | Description | Example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Backend REST API base URL used by the frontend. | `http://localhost:5001/api` |
| `VITE_WS_BASE_URL` | Yes | Backend WebSocket URL for live flight updates. | `ws://localhost:5001/ws` |
| `VITE_TILE_URL` | Yes | Map tile URL template. | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| `VITE_TILE_ATTRIBUTION` | Yes | Attribution text displayed for map tiles. | `© OpenStreetMap contributors` |

## Useful Commands

Backend:

```sh
cd Backend
npm run dev
npm run typecheck
npm run build
```

Frontend:

```sh
cd Frontend
npm run dev
npm run typecheck
npm run build
npm run preview
```

## Docker (Optional)

```sh
docker compose up --build
```

## Notes

- If optional provider keys are not set in backend `.env`, the app uses deterministic fallback behavior.
- API keys should only be stored in `Backend/.env` and never in frontend code.
