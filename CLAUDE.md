@AGENTS.md

# Dugsiye: multi-school management system

Somali/English school management for many Schools, each with Branches. Next.js 16 + Prisma 7 + PostgreSQL 17 + Better Auth.

## Read first

- [CONTEXT.md](CONTEXT.md): the domain glossary. Use its terms, with its meanings, in code, UI copy, and docs.
- [docs/](docs/): architecture decisions (ADR 0001–0010). Don't contradict an accepted ADR; write a new one that supersedes it.
- [docs/build-plan.md](docs/build-plan.md): the build plan, current status, and next step.

## Rules that are easy to break

- School data is reached **only** through `forSchool(schoolId, async (db) => …)` in `server/database/school.ts`. Never import `server/platform/db.ts` from a domain module.
- Every new school-owned table needs: `school_id uuid NOT NULL DEFAULT app_current_school()`, `@@unique([schoolId, id])`, composite `(school_id, x_id)` foreign keys to other school-owned tables, `ENABLE` and `FORCE ROW LEVEL SECURITY`, a `school_isolation` policy, and a `GRANT` to `dugsiye_app`, all written as SQL in the migration. `tests/integration/school-isolation.test.ts` fails if any are missing.
- Money is whole USD cents in `Int` columns ending in `Cents` (ADR 0003). Scores are stored ×100 the same way.
- Posted money and published grades are never edited in place: use reversals, adjustments, and corrections (CONTEXT.md).
- Pages that show school data are not cached (`use cache`), because School status and RLS must be checked on every request.
- Prisma blocks `migrate reset` and `db push --accept-data-loss` for agents. Ask the user before any destructive database command.

## Commands

- `npm test`: Vitest. Applies migrations to `dugsiye_test` first.
- `npm run typecheck`
- `npm run db:migrate`: `prisma migrate dev` against `dugsiye_dev`.
- `npx next typegen`: regenerates the route types (`LayoutProps` and others) when tsc complains.

## Working with the user

The user usually answers only the main A/B/C choice and skips follow-up questions. Ask each decision as its own structured question.
