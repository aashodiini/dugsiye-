# ADR 0005: A timetable is part of release 1

- Status: Accepted
- Date: 2026-10-25
- Extends: the release 1 scope in Technical Specification v1.0, which mentioned timetables only for the later student portal

## Context

Attendance is marked for every lesson, not once a day. Without a timetable, teachers would type in the section, subject, and period by hand, and the system could not tell which lessons were never marked.

## Decision

Release 1 includes a timetable.

- Each Branch defines its **periods** (a number plus start and end times).
- Each section has weekly **timetable slots**: `(sectionId, weekday, periodId) → teacherAssignmentId`. The subject comes from the teacher assignment.
- Each slot has `effectiveFrom` and an optional `effectiveUntil` date. Changing the timetable closes old slots and opens new ones, so the lessons for past dates can still be worked out.
- An **attendance session** points to the timetable slot and the date it was marked for. It is unique by `(slotId, date)`.
- **Unmarked lessons** are calculated by comparing the expected lessons for school days against the attendance sessions that exist.

## Consequences

- The release 1 scope grows: periods setup, a timetable editor, a "my lessons today" view for teachers, and an unmarked-lessons report.
- Unmarked-lesson reporting needs to know which days are school days, so a **school calendar** of holidays and closures is now required.
- Substitute teachers are handled with a **lesson cover**: `(slotId, date) → coverTeacherMembershipId`, assigned by a School Administrator. The cover teacher must be a `TEACHER` membership at the same Branch. Covers are arranged centrally, because there is no Branch head role ([ADR 0004](0004-one-role-per-membership.md)).
