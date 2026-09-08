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

## Criteria 1 and 2: primary evidence is CI, not a one-off script

The strongest evidence for both criteria isn't a manual check — it's `apps/backend/package.json`'s own `pretest`/`test` scripts, which run this exact path on **every single commit**, automatically:

```json
"pretest": "dotenv -e .env.test -- prisma migrate deploy",
"test": "tsx --env-file=.env.test --test"
```

CI's Postgres service starts a genuinely fresh container per run (no persisted volume — stronger than a manual `docker compose down -v`), `pretest` runs `prisma migrate deploy` against it from nothing, and `apps/backend/src/app.test.ts` then exercises `create`, `findMany` (read), and `deleteMany` (in `beforeEach`) through `lib/prisma.ts` — the exact `PrismaClient` + `@prisma/adapter-pg` instance the running app uses.

This is reproducible right now (`npm test -w apps/backend`), re-verified on every push, and independently checkable — for example, [CI run 34258780614](https://github.com/Jamesokooboh/AI-Engineering/actions/runs/34258780614) (backend job, `pull_request` event, `SUCCESS`).

**Manual supplement, for query shapes CI doesn't exercise.** The existing test suite covers `create`/`findMany`/`deleteMany` but not `count` or `findUnique`. Ran a script (not committed — its value is the recorded output below, not itself) importing `lib/prisma.ts` directly against a database freshly reset with `docker compose down -v`:

```bash
docker compose down -v && docker compose up -d --wait
(cd apps/backend && npx prisma migrate deploy)
```

```
1 migration found in prisma/migrations
Applying migration `20260823181117_add_mentor`
All migrations have been successfully applied.
```

```
connection + query succeeded, mentor count: 0
insert succeeded: 2bcae49c-d29d-480a-8cd1-8b59bf279bc0
read-back succeeded: Driver Verification
cleanup succeeded
```

Adds `count` and `findUnique` to what's already continuously verified — it isn't the primary evidence for either criterion, and shouldn't be read as more durable than the CI mechanism above.

## What was not verified

- **Concurrent/pooled load.** The script ran sequential single queries. Connection-pool behavior under concurrency wasn't tested.
- **Migration rollback.** Only the forward `migrate deploy` path was exercised. No down-migration or rollback scenario was tested.
- **Connection failure/retry behavior.** The server was healthy for the entire check; no dropped-connection or retry path was exercised.
- **A managed/production Postgres.** Only the local Docker `postgres:17` image was tested. RDS or any other managed Postgres, and any version other than 17.11, are unverified.
- **TLS/SSL connections.** The local connection uses no SSL. A `DATABASE_URL` requiring SSL is unverified.
- **Schema beyond the single `Mentor` model.** No relations, indexes beyond the primary key, or more complex migrations have been exercised yet.
- **The manual `count`/`findUnique` check ran against `ai_mentor` (dev), not `ai_mentor_test`.** The primary CI evidence above does use `ai_mentor_test`. The two databases share identical schema and are created by the same migration, but `count`/`findUnique` specifically weren't re-run against `ai_mentor_test`.
