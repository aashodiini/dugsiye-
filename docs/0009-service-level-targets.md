# ADR 0009: Service-level targets

- Status: Accepted
- Date: 2026-10-30
- Fulfils: Technical Specification v1.0 §1.3, which says these targets must be set before production launch

## Decision

These targets apply to the whole Platform. All Schools share one database ([ADR 0001](0001-shared-database-with-row-level-security.md)).

| Target | Value |
|---|---|
| Maximum data loss if the database fails (recovery point objective, RPO) | 5 minutes, through continuous point-in-time recovery |
| Maximum time to recover (recovery time objective, RTO) | 4 hours |
| Monthly availability | 99.5% |
| Backup retention | 35 days of point-in-time recovery, plus monthly copies kept for 1 year |
| Restore drill | Quarterly: a full restore into a separate environment, timed and written down |

## Restoring one School

Recovering a single School, for example after a School Administrator deletes something by mistake, is a **rare, manual, documented operation**, not a self-service feature. The steps are:

1. Restore to a point in time in a separate database.
2. Export the affected School's rows, filtered by `school_id`.
3. Reconcile those rows into production.
4. Record each step in the platform audit log.

The runbook lives in `docs/operations.md` and is rehearsed at least once a year as part of a restore drill.

## Consequences

- The managed Postgres provider must support continuous point-in-time recovery with at least 35 days of retention.
- Backup age, failed backups, and drill results are monitored, and failures alert the operator.
- The application rarely deletes rows outright, because invoices, payments, and grades are reversed or corrected instead. That makes restoring one School uncommon.
