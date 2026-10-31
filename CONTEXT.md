# Dugsiye: Domain Glossary

The shared vocabulary for the multi-school management system. Code, UI copy, and docs should use these terms with these meanings. Architecture decisions live in [docs/](docs/).

## Platform

**Platform**
The whole system, serving many independent Schools from one application and one database ([ADR 0001](docs/0001-shared-database-with-row-level-security.md)).

**Platform Super Administrator**
The operator of the Platform. Creates, approves, suspends, and archives Schools. Platform privileges are never inferred from any school role.

**School**
An independent tenant of the Platform: the organisation that operates one or more Branches. Every school-owned record carries a `schoolId`, and no School can read or change another School's data ([ADR 0002](docs/0002-school-is-the-organisation-with-branches.md)).

**School status**
`ACTIVE`, `SUSPENDED`, or `ARCHIVED`. A Platform Super Administrator creates a School directly as `ACTIVE`, with no approval step. Creating a School also creates its first Branch and sends the invitation to its first School Administrator, all in one transaction.
- `ACTIVE`: normal operation. Being active doesn't mean the School has gone live (see **Go-live date**).
- `SUSPENDED`: every school operation is blocked whatever any individual's membership says, and the status is checked on every request. Data is preserved. A suspended School can be made `ACTIVE` again.
- `ARCHIVED`: permanently closed after a deliberate export and a retention decision. It cannot be reactivated.

**Branch**
One site or campus of a School. Every School has at least one Branch. Branches are an authorization boundary, not an isolation boundary: a School-wide user sees all Branches, and a branch-limited user sees only theirs.

**Branch transfer**
Moving a student from one Branch to another within the same School. The student keeps their identity and history. This is different from a student leaving the School. A transfer is allowed only when the student's outstanding balance across all invoices is zero, including the current month's invoice from the old Branch. Invoices always stay with the Branch that issued them.

**Identity**
One person on the Platform, identified by a phone number, an email address, or both. A person has one identity even if they work at several Schools. School staff usually sign in by phone with an SMS code ([ADR 0007](docs/0007-sign-in-with-phone-or-email.md)).

**Language preference**
Each identity's choice of Somali (`so`) or English (`en`). Everything the user sees follows it, including menus, messages, School-entered names, and internal reports. Documents for parents are the exception: receipts and invoices use the fee payer's language, and report cards use the primary contact's language, whoever prints them. A guardian's language starts as the School's default. A user's preference also starts as the School's default and can be changed at any time ([ADR 0008](docs/0008-per-user-language.md)).

**Bilingual name**
A name a School enters in both Somali and English, both required. Used for subjects, class levels, sections, fee categories, and Branches. People's names and free text are not translated.

**Membership**
One person's access to one School. It has exactly one **role** and a **branch scope** ([ADR 0004](docs/0004-one-role-per-membership.md)).

**Role**
`SCHOOL_ADMIN`, `REGISTRAR`, `ACCOUNTANT`, or `TEACHER`. Each membership has exactly one. The permissions each role grants are fixed in code.

**Branch scope**
Which Branches a membership may act in: either School-wide or a list of Branches. `SCHOOL_ADMIN` is always School-wide. A teacher's scope is further narrowed by their section assignments.

**Teacher assignment**
Assigns a `TEACHER` membership to a section (and subject) for an academic year. Only `TEACHER` memberships can be assigned. A School Administrator who also teaches cannot be assigned to sections, so their classes' attendance and marks are entered by someone with the `TEACHER` role. There is no Branch head role in release 1.

## Students

**Student name**
Somali naming parts: `givenName`, `fatherName`, and `grandfatherName` are required, and `greatGrandfatherName` is optional. The display name joins them in that order. There is no first or last name. The optional `motherFullName` helps tell apart students who share a full name. Excel templates use the same columns.

**Guardian**
An adult responsible for one or more students at a School, stored once per School with a name and phone number. Guardians are school data, not Platform identities. When the parent portal arrives, a guardian is linked to an identity that signs in by phone.

**Guardian link**
Connects a guardian to a student (`GuardianStudent`), with the relationship (father, mother, uncle, and so on). Each student has exactly one **primary contact** and one **fee payer**, which may be the same guardian. **Siblings** are students who share a guardian.

**Guardian match**
When a new student's guardian phone number already belongs to a guardian at the School, the Registrar is shown that guardian and their children and confirms whether to link them. The system never links them automatically, because families often share one phone. Phone numbers are not unique among guardians.

## Attendance

**Period**
A numbered time slot in a Branch's school day, for example period 1 from 07:30 to 08:15. Each Branch defines its own periods ([ADR 0005](docs/0005-timetable-in-release-1.md)).

**Timetable**
A section's weekly plan: for each weekday and period, which subject is taught and by which teacher assignment. A Branch has one timetable per academic year. Changes take effect from a date, and past weeks are not rewritten.

**Lesson**
One timetable slot on a real date, for example Form 2-A, Monday 3 November 2026, period 2, Mathematics. A teacher's day is the list of lessons in their timetable slots.

**Attendance session**
The marking of one lesson. It is created when the teacher marks that lesson, and only the teacher whose assignment the timetable slot points to may mark it. A student can have several attendance records a day, one for each lesson.

**Lesson cover**
A School Administrator's assignment of another `TEACHER` membership at the same Branch to teach and mark one lesson on one date, in place of the timetabled teacher. While a cover exists, only the cover teacher may mark that lesson. The attendance session records who actually took it.

**School calendar**
The days a Branch is closed (weekends, public and religious holidays, and one-off closures). Holidays for the whole School apply to every Branch, and a Branch can add its own closures. Lessons are expected only on open days.

**Unmarked lesson**
A lesson the timetable says should have happened on an open day but that has no attendance session. It is reported to the School Administrator.

**Attendance record**
One student's status in one attendance session: `PRESENT`, `ABSENT`, `LATE`, or `EXCUSED`.

## Examinations

**Assessment**
One marked piece of work for one section, subject, and term, such as a monthly test, the midterm, or the final exam, with a maximum score (for example 10, 30, or 60). It is created by the teacher assigned to that section and subject, so two sections of the same class can have different assessments.

**Grade status**
Every enrolled student in a section has one entry for each assessment: `SCORED` (with a score from 0 to the maximum), `ABSENT` (counts as zero), or `EXCUSED`. A blank is never treated as zero, and a term's results cannot be published while any entry is still missing.

**Excused assessment**
An assessment left out of a student's subject result, for example because of illness. The result is scaled back to 100: 50 out of an available 70 becomes 71.43. Before publication, an excused entry can be replaced by a **make-up score** for the same assessment.

**Grade correction**
A change to a grade after its results are published. The teacher submits it with a reason, and a School Administrator approves or rejects it. On approval, the subject result and the section rank are recalculated, and the report card shows the new values with a "corrected on <date>" note. The correction record keeps the old value, new value, reason, requester, approver, and timestamps. Before publication, teachers change grades directly, and those changes are logged too.

**Section rank**
A student's position among the students in their section for a term, based on the total of their subject results. Students with equal totals share a rank, and the next rank is skipped (1, 2, 2, 4).

**Result publication**
Releasing a term's results to parents and students. Publication is recorded per Branch and term. A School Administrator can publish one Branch or every Branch in one action. Results for a section become visible once its Branch is published for that term.

**Subject result**
A student's term result in one subject: the sum of their assessment scores, out of 100. There are no percentage weights, because the maximum scores do the weighting. A subject's assessment maximums for a term must add up to exactly 100 before its results can be published.

## Migration

**Import scope**
Chosen by the School Administrator when the School starts using the system: **current academic year** only, or **full history** as well ([ADR 0006](docs/0006-historical-import-as-closed-records.md)).

**Go-live date**
The day a School starts working in the system. Academic years ending before it are historical.

**Historical record**
A record imported for a period before go-live. It is read-only, it is checked by integrity rules but not by workflow rules, and it is linked to the import job that created it.

**Name splitting**
Turning an imported full name into Somali name parts. The words are taken in order: given name, father's name, grandfather's name, and then great-grandfather's name. Any row the importer isn't sure about is flagged for review in the import preview, never guessed silently. That includes fewer than 3 or more than 4 words, and a word that commonly starts a two-word given name, such as "Abdi" or "Abdul" in "Abdi Rahman" or "Abdul Qadir". The list of such words is kept as configuration so that it can grow.

**Opening balance**
What a student owes at go-live, carried over from the old records as one line on their first invoice in the system. Used only with the current-year import scope. With full history, the unpaid historical invoices themselves carry the debt.

## Year end

**Class level**
An ordered step in a School's structure, such as Grade 1 to Grade 8, or Form 1 to Form 4. Each level has a `levelOrder`. Students are promoted from one level to the next, and students at the highest level graduate.

**Promotion rule**
A School setting that suggests each student's outcome at year end from their results, for example "average of subject results ≥ 50 means promote, otherwise repeat". Students with no results are marked "needs review". The rule only makes a suggestion and never decides.

**Promotion**
The Registrar's year-end step for a section. The system suggests an outcome for each student from the promotion rule: `PROMOTE`, `REPEAT`, `GRADUATE`, or `LEAVE`. The Registrar changes any exceptions, chooses next year's sections, and confirms. In one batch, confirming completes this year's enrollments and creates next year's. A graduating student gets the student status `GRADUATED`.

## What the School owns and what each Branch owns

| School-wide | Per Branch |
|---|---|
| Student identity and admission number | Classes and sections |
| Academic years and terms | Enrollments (through the section) |
| Subjects and grading scheme | Attendance, assessments, grades (through the section) |
| Staff profiles and employee numbers | Teacher assignments (through the section) |
| Fee structures, the same price at every Branch | Invoices, payments, receipts, and receipt numbering |

**Fee structure**
What a School charges for each class and fee category. It is set once for the whole School, and Branches cannot override it.

**Monthly invoice**
Fees are billed monthly. Each student gets exactly one invoice per **billing month**, issued by the Branch where they are enrolled. The billing month is stored as the first day of that month. One-off fees (registration, exams, uniform, books, transport) are added as extra lines on a monthly invoice, never as separate invoices.

**Issued invoice**
Once issued, an invoice's lines are never edited. A charge that arises after the month's invoice has been issued goes on the next month's invoice. A mistake on an issued invoice is corrected with a **financial adjustment**, not by changing its lines.

**No discounts**
Every student pays the price in the fee structure. The system has no discounts, waivers, or scholarships.

**Financial adjustment**
A correction to an issued invoice's amount, with a required reason, the person who made it, and a timestamp. It is used only to fix mistakes, never to give a discount.

**Branch cash**
Each Branch collects and accounts for its own money. Payments, receipts, and the receipt number sequence belong to the Branch where the money was received. Head office sees the totals across Branches but does not take payments itself.

**Payment**
Money received from one student's family for that one student. A parent paying for several children makes one payment per child, and each payment gets its own receipt. A payment can be split across several of that student's invoices, but never across siblings.

**Payment method**
How a payment was received: `CASH`, `MOBILE_MONEY`, or `BANK_TRANSFER`. A mobile-money payment also records its provider (`EVC_PLUS`, `ZAAD`, `SAHAL`, `EDAHAB`) and transaction reference. A bank transfer records its bank reference. Release 1 records these payments by hand and does not connect to any provider.

**Currency**
USD only. All amounts are stored as whole cents ([ADR 0003](docs/0003-usd-only-money-as-integer-cents.md)).

**Partial payment**
A payment smaller than the outstanding balance on an invoice. It is accepted only when the student has an active **payment arrangement** covering that invoice. The unpaid remainder stays on the invoice as an **outstanding balance**.

**Payment arrangement**
A School Administrator's recorded approval that a particular student's family may pay in parts for a chosen range of billing months (`fromMonth` to `untilMonth`, inclusive). By default the range runs to the end of the current term. Without an arrangement covering an invoice's billing month, the accountant must collect the full outstanding balance. Every partial payment records which arrangement allowed it, and a student's active arrangements never overlap.

**Outstanding balance**
The amount still owed on an invoice after all payments and adjustments are counted. It is always calculated from those records and never stored as a number someone can edit.

## Isolation

**School-scoped client**
The only way domain code reads or writes school data: `forSchool(schoolId, async (db) => …)`. The work runs in one transaction that first sets the School. Postgres then filters every read to that School, rejects any write for another School, and fills in `school_id` on inserts. Domain services have no other database client.

**Platform client**
The database client for platform services only, such as the School registry, looking up memberships at sign-in, and Platform Super Administrator work. It is not bound by row-level security, so domain modules must never import it.

**Row-level security (RLS)**
The database-enforced last line of isolation. Postgres rejects any row whose `school_id` doesn't match the School set for the current transaction.
