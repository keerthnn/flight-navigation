# Validation

Automated test files and mock fixtures were removed by request.

## Backend

- Run `cd Backend && npm run typecheck`.
- Run `cd Backend && npm run build`.
- Run `cd Backend && npm audit --audit-level=moderate`.

## Frontend

- Run `cd Frontend && npm run typecheck`.
- Run `cd Frontend && npm run build`.
- Run `cd Frontend && npm audit --audit-level=moderate`.

## Manual Smoke Check

Start the backend and frontend, search two airports, generate a route corridor, inspect active-flight provider status, and verify the UI handles an empty live-flight result without showing fabricated traffic.
