# Architecture Design Note

## What this project is

An AI mentorship platform. Users book and pay for 1-on-1 sessions with mentors; the platform manages mentor availability and scheduling.

## Main parts and how they connect

- **`apps/frontend`** — Next.js (TypeScript). Currently renders a static placeholder page. It does not call the backend yet — there is no wired frontend-to-backend path in the shipped code, and this note doesn't pretend otherwise.
- **`apps/backend`** — Express API (TypeScript), split into:
  - `src/index.ts` — the process entry point. Its only job is to load validated config and call `app.listen()`.
  - `src/app.ts` — the Express app itself: routes (`/health`, `/mentors`) and the error-handling middleware. Exported with no side effects, so it can be imported directly without starting a real server.
  - `src/lib/env.ts` — validates `DATABASE_URL` and `PORT` at startup, with working defaults and a clear failure message if either is malformed.
  - `src/lib/prisma.ts` — the single Prisma client instance (with its Postgres driver adapter), used by every route that touches the database.
- **PostgreSQL** — the database. Locally it runs via `docker-compose.yml`; schema changes are tracked as Prisma migrations under `apps/backend/prisma/migrations`, committed to git.
- **GitHub Actions CI** (`.github/workflows/ci.yml`) — runs lint and a type-checking build for both apps on every pull request into `main`; the `backend` job additionally runs a real-database test suite (the `frontend` job has no test step). Branch protection on `main` is *intended* to require both jobs to pass before a change can merge — that rule lives in GitHub's repository settings, not in this git history, so nothing you clone can confirm it's actually on. Check the repo's branch protection settings directly (see README's Checks section for the same caveat).

The two routes that exist today: `/health` returns a hardcoded object with no database access at all — deliberately, so it still answers when Postgres is down — and `/mentors` queries Postgres through the Prisma client in `lib/prisma.ts` and returns the result as JSON. There's no auth, no additional services, and no frontend integration yet.

## Why it's structured this way

**Backend split into `index.ts` / `app.ts`, not one file.** This follows the standard pattern for testing an Express app: keep `app.listen()` out of the exported app so `supertest` can send real HTTP requests to it without binding a network port. It was designed in proactively, when the first test (`/health`) was added — not as a fix for observed flakiness in this codebase. Nobody built the single-file version here and watched it fail; the split applies a known best practice up front.

**`lib/env.ts` and `lib/prisma.ts` centralize startup-time, cross-cutting concerns.** Every route that will ever exist needs a validated `DATABASE_URL` and a working Prisma client. Putting both behind one shared module means a misconfigured environment fails once, at startup, with one clear message — not silently, three different ways, the first time three different routes each try to read `process.env` themselves.

**Monorepo, not separate frontend/backend repos.** The two apps share nothing yet, but they're expected to: Prisma generates TypeScript types from the schema, and the plan is for the frontend to eventually import those types directly rather than hand-maintaining a duplicate API contract. A monorepo makes that free; separate repos would require publishing and versioning a shared types package for a two-person team with no reason yet to deploy the two apps on different schedules.

## Alternatives considered

**Separate repositories for frontend and backend, rejected.** The cost is real and immediate (a published, versioned package just to share types) while the benefit — independent deploy cadences, independent access control — doesn't apply yet to a single small team shipping both apps together.

**Everything in one file (`index.ts` calling `app.listen()` directly, with routes inline) — considered, not attempted.** Rejected before writing it: without the split, tests exercising the routes would have to either mock the whole app (losing real coverage) or bind a real network port per test run, a well-known source of flaky, hard-to-parallelize tests. This codebase never actually ran that version to confirm the problem — the split was applied proactively based on the pattern, at no extra cost.

**Feature-folders (`src/mentors/`, `src/health/`, each with its own routes/model/etc.), rejected for now.** With two routes and zero shared business logic between them, a feature-folder structure is pure ceremony — there's nothing yet for the folders to separate. This is the one structural decision genuinely open to revisiting: the trigger for splitting is a second real domain (bookings, payments) with its own logic, not an arbitrary route count.
