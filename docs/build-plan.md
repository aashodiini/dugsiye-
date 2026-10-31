# Build plan

Release 1 is built as one vertical slice at a time. Each step ends with passing tests. The domain rules are in [CONTEXT.md](../CONTEXT.md) and the decisions are in the ADRs in this folder.

## Status (2026-10-31)

### Done

- Domain interview completed: CONTEXT.md and ADRs 0001–0010.
- Next.js 16.4 scaffold (TypeScript, Tailwind 4, App Router, Cache Components on), git initialised, nothing committed yet.
- Packages: Prisma 7.10 (`@prisma/adapter-pg`), Better Auth 1.7, Zod 4, Vitest 5.
- PostgreSQL 17.11 installed locally and running as the Windows service `postgresql-x64-17`.
- Step 1 code is written and type-checks, but has **not been run yet**:
  - `prisma/schema.prisma`: User, PlatformAdministrator, School, Branch, SchoolMembership, MembershipBranch.
  - `prisma/migrations/20261031000000_foundation`: tables, `app_current_school()`, RLS policies, grants.
  - `server/database/school.ts` (`forSchool`) and `server/platform/db.ts` (`platformDb`).
  - `tests/integration/school-isolation.test.ts`.
  - `.env` with generated role passwords (git-ignored).

### Blocked: the user must run this first

Roles and databases don't exist yet (the `dugsiye_owner` login fails). In PowerShell, from the project folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\db\setup-local.ps1
```

It asks for the `postgres` superuser password chosen during install. The script is git-ignored because it contains the generated passwords from `.env`. If it's lost, recreate it from the passwords in `.env` and [scripts/db/setup.sql](../scripts/db/setup.sql).

### Next action

1. Confirm the setup ran: `dugsiye_dev` and `dugsiye_test` exist, and the three roles can log in.
2. `npx prisma migrate deploy` (dev), then `npm test`. All isolation tests must pass.
3. Fix whatever fails, then make the first commit (with the user's go-ahead).

## Steps

| # | Step | Contents | Status |
|---|---|---|---|
| 1 | Foundation | Schema core, RLS migration, `forSchool`/`platformDb`, isolation tests | Code written, not yet run |
| 2 | Sign-in | Better Auth: phone OTP + email, Platform admin email + 2FA, invitations, `SmsSender` interface (console sender in dev), rate limits; `preferredLocale`; `so`/`en` message catalogues; locale from preference, not URL (ADR 0007, 0008) | |
| 3 | Platform admin | Create School (School + first Branch + admin invitation in one transaction), suspend and reactivate, archive; status checked on every request | |
| 4 | Academic structure | Academic years, terms, class levels (`levelOrder`), sections, subjects (bilingual names), staff profiles, teacher assignments (`TEACHER`-only composite FK), school calendar | |
| 5 | Students | Somali name parts, admission numbers, guardians + links + guardian match, enrollment, Branch transfer (zero-balance rule) | |
| 6 | Finance | Fee structures, monthly invoices, invoice lines, payments, allocations, arrangements (exclusion constraint), reversals, adjustments, receipts + Branch counters, `invoice_balance` view | |
| 7 | Timetable & attendance | Periods, timetable slots, lessons, lesson cover, attendance sessions and records, unmarked-lesson report | |
| 8 | Examinations | Assessments, grade status, make-ups, subject results, section rank, result publication per Branch, grade corrections | |
| 9 | Excel imports | Templates (versioned), upload, validation, preview, commit; current-year vs full-history scope; name splitting; historical records (ADR 0006) | |
| 10 | Promotion & reports | Promotion rule, Registrar promotion step, graduation; reports; audit log; backups and drills (ADR 0009) | |

## Known gaps to handle in their step

- Step 2: Better Auth requires an email, so phone-only identities get a placeholder email from the phone-number plugin. Make sure it's never shown or used to send anything.
- Step 3: "SCHOOL_ADMIN memberships have no Branch list" is enforced only in the service for now. Add a test.
- Areas not yet covered in the interview: audit log contents, the report list, School export and archival, parent portal needs. Interview the user before building them.
- Not yet chosen: the SMS provider, and production Postgres and hosting.
