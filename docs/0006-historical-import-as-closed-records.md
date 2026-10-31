# ADR 0006: Historical data is imported as closed, read-only records

- Status: Accepted
- Date: 2026-10-25

## Context

When a School joins, its School Administrator chooses how much to import: the **current academic year** only, or **full history** for past years as well. Historical spreadsheets were never kept under this system's rules. They contain partial payments without arrangements, their own receipt numbers, and exams that don't add up to 100.

## Decision

- Each School has a **go-live date**. Academic years that end before it are **historical**.
- Imported historical records (years, terms, sections, enrollments, assessments, grades, invoices, payments) carry the `importJobId` of the import that created them and are read-only once that import is committed.
- **Integrity rules still apply to history**: the `school_id` and RLS policies, foreign keys, uniqueness, positive amounts, scores within the maximum, and allocations not exceeding the balance.
- **Workflow rules do not apply to history**: payment arrangements for partial payments, Branch receipt counters (an imported receipt keeps its `legacyReceiptNumber`), the rule that maximums add up to 100, grade correction approval, and unmarked-lesson reporting.
- Historical results are published as part of the import. Section ranks for history are calculated from the imported scores, unless the template supplies the original ranks.
- The current academic year is always imported under the live rules. Its records become ordinary editable records after commit.
- Debt from before go-live is carried over one way only. With **current year only**, each student gets an **opening balance**. With **full history**, unpaid historical invoices remain the debt, and live payments can be allocated to them. Read-only means the invoice itself never changes, but new payments against it are allowed. A School never has both.
- An import can be undone as a whole only while no live record refers to anything it created.

- Historical grades come in one of two shapes, chosen per import:
  - **Assessment detail**: assessments and grades, with subject results calculated as for live terms (the 100 rule does not apply).
  - **Summary**: one `HistoricalSubjectResult` per student, subject, and term (`scoreCents`, `maxScoreCents`, optional original rank), with no assessments. Reports and transcripts read live subject results and historical summaries through one read model.
- Student names can be imported in either layout, chosen at upload: separate name-part columns, or one full-name column that the importer splits.

## Consequences

- The import templates have historical variants with extra columns (`legacyReceiptNumber`, original rank).
- Domain services check `isHistorical` before applying workflow rules. Tests must cover both paths.
- A full-history import makes onboarding slower and is optional. Choosing "current year only" stays the fast path.
