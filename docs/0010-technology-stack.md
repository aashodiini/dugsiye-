# ADR 0010: Technology stack for release 1

- Status: Accepted
- Date: 2026-10-31

## Decision

| Concern | Choice |
|---|---|
| Application | Next.js 16 (App Router), React 19, TypeScript, one deployable modular monolith |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL 17, run locally for development; a managed provider with point-in-time recovery in production ([ADR 0009](0009-service-level-targets.md)) |
| Data access | Prisma, with one schema; RLS policies and the constraints Prisma can't express are written as SQL in the migrations ([ADR 0001](0001-shared-database-with-row-level-security.md)) |
| Authentication | Better Auth, storing identities in our own Postgres. The phone-number plugin handles SMS one-time codes, the email plugin handles email, and the two-factor plugin covers Platform Super Administrators ([ADR 0007](0007-sign-in-with-phone-or-email.md)) |
| Translations | Message catalogues for `so` and `en`; the locale comes from the user's saved preference, not the URL ([ADR 0008](0008-per-user-language.md)) |
| Validation | Zod, on the server |
| Tests | Vitest for unit and integration tests against a real Postgres, plus RLS isolation tests; Playwright for end-to-end tests |

## Open

- The SMS provider. It sits behind an `SmsSender` interface, and development uses a console sender.
- The production Postgres provider and hosting.
