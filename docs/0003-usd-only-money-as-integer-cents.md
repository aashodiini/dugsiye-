# ADR 0003: USD only, with money stored as integer cents

- Status: Accepted
- Date: 2026-10-23

## Context

Every School on the Platform charges and collects fees in US dollars. Specification v1.0 asked for "explicit monetary precision and currency".

## Decision

- The Platform supports one currency, USD. Money tables have no per-row `currency` column.
- Every amount is stored as a whole number of cents in a column ending `Cents`, for example `amountCents Int`. Floats and Prisma `Decimal` are not used for money.
- Amounts are converted to dollars for display only, in the presentation layer.

## Consequences

- Arithmetic is exact, and sums can be done in SQL without rounding drift.
- Supporting a second currency later means adding a `currency` column to the money tables (invoices, invoice lines, payments, allocations, adjustments) and refusing to mix currencies within one invoice. That migration is small because the number of money tables is small.
- A 32-bit `Int` holds up to about $21 million per row, which is far more than any single fee or payment. Totals computed in SQL come back as `bigint`.
