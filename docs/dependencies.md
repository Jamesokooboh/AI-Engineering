# Dependency triage

One entry per dependency added, at the time it's added: what it's for, and whether its major version is young enough to need extra scrutiny before relying on it (see the AE-002 Prisma 7 incident — a one-release-old major version changed a core requirement without warning).

## prettier ^3.9.6

Added in AE2-001, for repo-wide code formatting enforced in CI.

Prettier 3.0 shipped mid-2023 and has been the stable major version for two years; this is not a young dependency. No breaking-change risk assessment needed beyond the normal minor/patch update discipline.
