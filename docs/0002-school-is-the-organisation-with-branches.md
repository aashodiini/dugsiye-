# ADR 0002: A School is the organisation, and Branches live inside it

- Status: Accepted
- Date: 2026-10-23

## Context

Many Somali school operators run several branches under one name. Branches share a brand, policies, and often staff, but each has its own students and principal. Specification v1.0 had no level above or below School.

## Decision

The tenant (the **School**) is the operating organisation. A **Branch** is a school-owned entity inside it. A School with one site still has exactly one Branch.

- Tenant isolation ([ADR 0001](0001-shared-database-with-row-level-security.md)) stays at the School level. Branches are not an RLS boundary.
- Branch access is an authorization rule. A membership is either School-wide or limited to specific Branches, and that check runs in domain services.
- Moving a student from one Branch to another is an internal move that keeps the student's identity and history. It is not a withdrawal followed by a new admission.

## Consequences

- Every branch-owned record carries `branchId` as well as `schoolId`.
- Head-office users can report across Branches without any cross-tenant access.
- A School cannot later be split into separate tenants without a data migration. Branches that need hard isolation from each other should be onboarded as separate Schools.
