# AI-Engineering

AI mentorship booking platform. See [docs/adr/001-technology-stack.md](docs/adr/001-technology-stack.md) for the technology stack decision and rationale.

## Structure

This is an npm workspaces monorepo:

- `apps/frontend` — Next.js (TypeScript)
- `apps/backend` — Express API (TypeScript, Prisma, PostgreSQL)

## Getting started

```bash
npm install
```

### Backend

```bash
docker compose up -d --wait       # starts local Postgres, waits until it accepts connections
(cd apps/backend && npx prisma migrate deploy)
npm run dev -w apps/backend
```

No `.env` file needed — the defaults below match this Postgres setup out of the box. Copy `apps/backend/.env.example` to `apps/backend/.env` only if you want to override something.

Runs on `http://localhost:4000` — check `/health` and `/mentors`.

### Frontend

```bash
npm run dev -w apps/frontend
```

Runs on `http://localhost:3000`.

## Configuration

Backend runtime settings live in `apps/backend/.env` (never committed — see `.env.example` for the template). Override any of these by editing that file, or by exporting the variable in your shell before running:

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/ai_mentor?schema=public` (matches `docker-compose.yml`) | Postgres connection string. Startup fails with a clear error if set to something other than a `postgresql://` URL. |
| `PORT` | `4000` | Port the API listens on. Startup fails with a clear error if set to something other than a valid port number (1-65535). |

Changes take effect on the next `npm run dev`/`npm start` — no rebuild needed.

## Checks

These are the exact checks CI runs on every change to `main` (see `.github/workflows/ci.yml`). Run them locally before pushing — a fresh checkout gets the same pass/fail result as the main gate.

```bash
docker compose up -d --wait        # backend checks need Postgres running

npm run lint -w apps/backend
npm test -w apps/backend           # exercises the core path (GET /mentors) against a real database
npm run build -w apps/backend

npm run lint -w apps/frontend
npm run build -w apps/frontend
```

All five must pass before a change can land on `main`.
