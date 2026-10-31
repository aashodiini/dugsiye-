# ADR 0001: Shared database with row-level security

- Status: Accepted
- Date: 2026-10-23
- Supersedes: the "Separate managed PostgreSQL database for each school" decision in Technical Specification v1.0

## Context

Specification v1.0 put each School in its own PostgreSQL database. That design needs a provisioning pipeline, a secrets manager entry per School, a migration orchestrator that runs across N databases, and a connection pool per tenant. Prisma handles that poorly on serverless hosting such as Vercel. The schools we expect are small to medium, and the team is small.

## Decision

All Schools share one PostgreSQL database.

- Every school-owned table has a non-null `school_id` column, and every index and unique constraint that should be per School starts with it, for example `(school_id, admission_number)`.
- Domain code reaches school data only through the **school-scoped client**, `db.forSchool(schoolId)`. It adds the School filter to every read and sets `school_id` on every write.
- Postgres **row-level security** is the backstop. Each request runs in a transaction that calls `set_config('app.school_id', <id>, true)`, and the policies compare `school_id` against it. The application's database role does not own the tables and does not have `BYPASSRLS`.
- Platform tables (School registry, memberships, platform audit) have no RLS tenant policy and are reached only through platform services.

## Consequences

- Spec sections 2.1 (School A/B databases), 4.1 `SchoolDatabase`, 4.4 (per-school migration orchestrator), 5.1–5.3 (database provisioning jobs), and 5.4 (per-school credentials) no longer apply. Onboarding a School becomes a registry insert plus an admin invitation.
- There is one migration history, one connection pool, and one backup stream.
- Isolation depends on correct RLS policies, so cross-school isolation tests run in CI against every school-owned table.
- Exporting or deleting a single School is a filtered operation, not a database drop. It needs its own tested procedure.
- Restoring one School to a point in time cannot be done by restoring the whole database. It requires restoring into a scratch database and copying that School's rows back.
- Moving a School to its own database later is still possible because every row carries `school_id`.
