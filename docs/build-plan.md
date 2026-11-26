# Build plan

Release 1 is built as one vertical slice at a time. Each step ends with passing tests. The domain rules are in [CONTEXT.md](../CONTEXT.md) and the decisions are in the ADRs in this folder.

## Status (2026-10-31)

### Done

- Domain interview completed: CONTEXT.md and ADRs 0001–0010.
- Next.js 16.4 scaffold (TypeScript, Tailwind 4, App Router, Cache Components on), git initialised, nothing committed yet.
- Packages: Prisma 7.10 (`@prisma/adapter-pg`), Better Auth 1.7, Zod 4, Vitest 5.
- PostgreSQL 17.11 installed locally and running as the Windows service `postgresql-x64-17`.
- **Step 1 (foundation) is done.** The roles and the `dugsiye_dev` and `dugsiye_test` databases exist on port 5432, the foundation migration is applied to both, and all 10 isolation tests pass.
  - `prisma/schema.prisma`: User, PlatformAdministrator, School, Branch, SchoolMembership, MembershipBranch.
  - `prisma/migrations/20261031000000_foundation`: tables, `app_current_school()`, RLS policies, grants.
  - `server/database/school.ts` (`forSchool`) and `server/platform/db.ts` (`platformDb`).
  - `tests/integration/school-isolation.test.ts`.
  - `.env` with generated role passwords (git-ignored). `scripts/db/setup-local.ps1` (git-ignored) is the one-time setup that created the roles. On a new machine, generate new passwords and rerun [scripts/db/setup.sql](../scripts/db/setup.sql).

- **Step 2a (sign-in core) is done**, with 33 tests passing:
  - Better Auth tables, plus `invitation` (RLS-protected) and `code_send_log`. Migrations `20261125000000_sign_in` and `20261125000100_invitation_rls`.
  - `server/auth/auth.ts`: phone code, email code, and two-factor plugins; invitation-only user creation; invitations accepted on every new session.
  - `server/auth/codes.ts`: codes go only to known contacts, at most 5 per destination per hour.
  - `server/auth/senders.ts`: the `CodeSender` interface. The SMS provider was deferred by the user on 2026-11-25; dev uses `console`, tests use `memory`.
  - `server/platform/invitations.ts`: `createInvitation`, `acceptPendingInvitations`.
  - Route `app/api/auth/[...all]/route.ts`.

- **Step 2b (language and sign-in screens) is done**, with 37 tests passing, a clean production build, and an HTTP smoke test (seeded invite → code → session → home page in Somali, then in English):
  - `i18n/`: `so` and `en` message catalogues (a test keeps their keys and placeholders identical), `format()`, and the `dugsiye_locale` cookie.
  - `server/i18n/locale.ts` (`getLocale`, `getMessages`) and `server/auth/session.ts` (`getCurrentIdentity`, `requireIdentity`).
  - `app/sign-in/`: phone or email, then code. `app/page.tsx`: your Schools and roles, language switcher, sign-out. `app/actions/locale.ts`: `setLanguage`, `syncLocaleCookie`.
  - `<html lang>` is set by an inline script from the cookie, so the shell stays static under Cache Components.
  - `npm run db:seed`: the demo School "Dugsiga Horseed" (Hodan and Wadajir Branches) with invitations for +252610000001 (School administrator), +252610000002 (teacher), and +252610000003 (accountant).
  - Next.js upgraded from 16.4.3 to 16.4.6 for seven published advisories. The remaining `npm audit` items are in Prisma's CLI config loader (`effect`), and npm's only suggested fix is a downgrade to Prisma 6, so they're left as they are.
- **Somali translations need review by a native speaker** before launch.

- **Step 2c (Platform Super Administrators) is done**, with 43 tests passing and an HTTP smoke test against the production build:
  - `npm run platform:admin -- --email … --name "…"` creates an administrator with a generated password, shown once.
  - `/platform/sign-in` (email and password, then the authenticator code), `/platform/two-factor` (setup key, an otpauth link, 10 backup codes), and `/platform`, guarded by `requirePlatformAdmin()`.
  - Gap closed: code-based sign-in bypasses Better Auth's two-factor, so platform admins never get codes and code sessions are refused for them.
  - Not done yet: a QR code on the setup screen. Today it shows the setup key and an otpauth link.

### Next action

Step 3 (Platform admin): create a School (School, first Branch, and the first School Administrator's invitation in one transaction), list Schools, suspend, reactivate, and archive, with School status checked on every request; a per-School invitation limit; and a platform audit log for these actions. Decide the audit log contents with the user first.

## Steps

| # | Step | Contents | Status |
|---|---|---|---|
| 1 | Foundation | Schema core, RLS migration, `forSchool`/`platformDb`, isolation tests | Done |
| 2 | Sign-in | Better Auth: phone OTP + email, Platform admin email + 2FA, invitations, `CodeSender` interface (console sender in dev), rate limits; `preferredLocale`; `so`/`en` message catalogues; locale from preference, not URL (ADR 0007, 0008) | Done |
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
