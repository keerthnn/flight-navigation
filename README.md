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
