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
cp apps/backend/.env.example apps/backend/.env
# edit DATABASE_URL to point at your local Postgres instance
npm run dev -w apps/backend
```

Runs on `http://localhost:4000` — check `/health`.

### Frontend

```bash
npm run dev -w apps/frontend
```

Runs on `http://localhost:3000`.
