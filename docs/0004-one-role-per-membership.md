# ADR 0004: One role per membership, with permissions defined in code

- Status: Accepted
- Date: 2026-10-23
- Supersedes: the `SchoolRole`, `Permission`, `RolePermission`, and `UserRole` tables in Technical Specification v1.0

## Context

Specification v1.0 modelled configurable roles and many-to-many role and permission tables. In practice each staff member at a School does one job.

## Decision

- A **membership** (one person at one School) has exactly one `role`: `SCHOOL_ADMIN`, `REGISTRAR`, `ACCOUNTANT`, or `TEACHER`. The column is a non-null enum on the membership.
- A membership's **branch scope** is either School-wide or a list of Branches. `SCHOOL_ADMIN` is always School-wide.
- The permissions each role grants are a constant map in code (`modules/authorization`), not database rows. Changing a role's permissions is a code change with review and tests.
- A person who works at two Schools has two memberships, and the two can have different roles.

## Consequences

- An authorization check is a lookup: the membership's role, its permission set, its branch scope, then any resource rule such as the teacher's section assignment.
- Schools cannot create custom roles. If they need to later, a role table replaces the enum, and the code map becomes the seed data for it.
- Someone who does two jobs at the same School cannot hold two roles. Roles do not include each other's permissions: a `SCHOOL_ADMIN` cannot be assigned to teach a section. This was decided on 2026-10-24.
- Only `TEACHER` memberships can have teacher assignments. The database enforces this with a composite foreign key from `(membership_id, role)` to the membership, with `role` fixed to `TEACHER`, so a teacher's role cannot change while they still have assignments.
