# ADR 0008: Each user chooses Somali or English for the whole system

- Status: Accepted
- Date: 2026-10-27
- Amends: the `app/[locale]/` routing in Technical Specification v1.0, §2.4

## Context

The interface must be fully bilingual. Schools also enter their own names (subjects, class levels, fee categories, Branches), and these appear on report cards, invoices, and receipts.

## Decision

- Each **identity** has a `preferredLocale`, either `so` or `en`. Its initial value is the inviting School's `defaultLocale`. The user can change it at any time, and the change takes effect everywhere immediately. Because it is stored on the identity, a person who works at two Schools has one language setting.
- Everything the system shows or generates is rendered in the current user's locale: menus, buttons, validation and error messages, dates and numbers, and printed or exported documents (report cards, invoices, receipts, reports).
- Names that Schools enter for **subjects, class levels, sections, fee categories, and Branches** are stored in both languages (`nameSo` and `nameEn`), and **both are required**. A screen never falls back to the other language.
- Not translated, shown as typed: people's names, assessment names, notes, reasons, and other free text.
- The locale comes from the saved preference, not from the URL. The spec's `app/[locale]/` route segment is dropped. Logged-out pages (sign-in, invitation acceptance) use a cookie, or the invitation's School default.

## Consequences

- Setup forms and import templates for the bilingual entities need a Somali and an English name column. Imports refuse rows that are missing either one.
- **Documents for parents follow the guardian, not the staff member.** `Guardian` has its own `preferredLocale`, which defaults to the School's `defaultLocale`. Receipts and invoices are produced in the **fee payer's** language, and report cards in the **primary contact's** language, whoever prints them. Staff screens, internal reports, and exports still follow the staff member's own preference. This was decided on 2026-10-28.
- Generated files such as PDF reports and exports are created in the language of the user who asked for them, and that language is stored with the file.
