# Database driver path verification

Sprint 01's retro flagged that the ORM/driver-adapter wiring shipped without a recorded check — a reviewer had to catch that Prisma 7 requires an explicit driver adapter. This is that record: the exact versions verified together, the commands run, and the observed result. Committed evidence, not a claim.

## Versions verified together

| Component | Version | Source |
|---|---|---|
| `prisma` (CLI) | 7.9.1 | `npm list --workspace=apps/backend` |
| `@prisma/client` | 7.9.1 | `npm list --workspace=apps/backend` |
| `@prisma/adapter-pg` | 7.9.1 | `npm list --workspace=apps/backend` |
| `pg` | 8.23.0 | `npm list --workspace=apps/backend` |
| PostgreSQL server | 17.11 (Debian 17.11-1.pgdg13+2) | Confirmed identical locally and in CI — `postgres:17` is a floating tag, so this was checked, not assumed. Local: `docker exec ai-engineering-postgres-1 postgres --version`. CI: [run 34258780614](https://github.com/Jamesokooboh/AI-Engineering/actions/runs/34258780614) log, `starting PostgreSQL 17.11 (Debian 17.11-1.pgdg13+2)`. |

## Criteria 1 and 2: evidence is the committed, continuously-run test suite

The evidence for both criteria isn't a one-off script — it's `apps/backend/package.json`'s own `pretest`/`test` scripts:

```json
"pretest": "dotenv -e .env.test -- prisma migrate deploy",
"test": "tsx --env-file=.env.test --test"
```

CI's Postgres service starts a genuinely fresh container per run (no persisted volume), `pretest` runs `prisma migrate deploy` against it from nothing, and `apps/backend/src/app.test.ts` exercises `create`, `findMany`, `deleteMany`, `count`, and `findUnique` through `lib/prisma.ts` — the exact `PrismaClient` + `@prisma/adapter-pg` instance the running app uses. `count`/`findUnique` specifically are covered by a dedicated test (`driver-adapter path: count and findUnique`), added as part of this record rather than left as unreproducible pasted output.

This runs, per `.github/workflows/ci.yml` at the time of writing, on every push to `main` and every pull request into `main` — not on every commit; a commit pushed only to a feature branch with no open PR does not trigger it. It's reproducible right now (`npm test -w apps/backend`) and independently checkable — for example, [CI run 34258780614](https://github.com/Jamesokooboh/AI-Engineering/actions/runs/34258780614) (backend job, `pull_request` event, `SUCCESS`).

**Local reproduction of criterion 1**, against a database reset from nothing (not relying on CI alone):

```bash
docker compose down -v && docker compose up -d --wait
(cd apps/backend && npx prisma migrate deploy)
```

```
1 migration found in prisma/migrations
Applying migration `20260823181117_add_mentor`
All migrations have been successfully applied.
```

## What was not verified

- **Concurrent/pooled load.** All queries in the test suite and the local reproduction run sequentially. Connection-pool behavior under concurrency wasn't tested.
- **Migration rollback.** Only the forward `migrate deploy` path was exercised. No down-migration or rollback scenario was tested.
- **Connection failure/retry behavior.** The server was healthy for the entire check; no dropped-connection or retry path was exercised.
- **A managed/production Postgres.** Only the local Docker `postgres:17` image was tested. RDS or any other managed Postgres, and any version other than 17.11, are unverified.
- **TLS/SSL connections.** The local connection uses no SSL. A `DATABASE_URL` requiring SSL is unverified.
- **Schema beyond the single `Mentor` model.** No relations, indexes beyond the primary key, or more complex migrations have been exercised yet.
- **`update` and multi-row queries.** The test suite and local reproduction cover `create`, `findMany`, `findUnique`, `count`, and `deleteMany` — `update` and any query returning more than one specific row (e.g. `findMany` with a `where` filter) haven't been exercised.
