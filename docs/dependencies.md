# Dependency triage

One entry per dependency added, at the time it's added, answering four questions: what it is, how old its major version is, whether it's actively maintained, and why it was chosen over the real alternative. Age alone isn't the same as maintenance — see the AE-002 Prisma 7 incident for why a one-release-old major version needs scrutiny, but a stable-for-years package with an abandoned maintainer is a different risk the age check alone won't catch.

## prettier ^3.9.6

Added in AE2-001, for repo-wide code formatting enforced in CI.

**What it is:** the standard opinionated code formatter for JS/TS/CSS/Markdown.

**Major version age:** Prettier 3.0 shipped mid-2023, over two years old. Not a young dependency.

**Maintained:** yes, verified against npm's registry, not assumed. Latest release (3.9.6) was 2026-07-21, about seven weeks before this note. Release history shows a regular cadence through 2026 (multiple releases most months), plus an active `4.0.0-alpha` line already in progress — signs of a maintained project, not one coasting on an old stable release.

**Chosen over Biome (`@biomejs/biome`).** Also actively maintained (2.5.12, last published 2026-09-03) and not a fringe alternative — checked, not dismissed by reputation. Rejected for scope, not quality: Biome replaces the linter as well as adding a formatter, and this ticket explicitly puts lint changes out of scope (confirmed by testing: removing `eslint-config-prettier` from both apps' lint configs produced zero lint failures, meaning there's no existing lint/format conflict for Biome to solve either). Prettier is the smaller, targeted change that does only what this ticket asks.
