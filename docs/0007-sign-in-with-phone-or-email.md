# ADR 0007: Sign in with a phone number or an email address

- Status: Accepted
- Date: 2026-10-25
- Amends: the email-based invitation and recovery flow in Technical Specification v1.0, §3.1

## Context

Many school staff in Somalia use a phone number every day but rarely check email, and some have no email address at all. An invitation flow that only uses email would shut them out.

## Decision

- A person's central identity has a **phone number**, an **email address**, or both. At least one is required. Phone numbers are stored in E.164 format (for example `+252612345678`). Email addresses are stored lowercased. Each is unique across the Platform when present.
- School staff are invited **by phone by default**. They sign in with a one-time code sent to whichever contact the invitation used: by SMS for a phone, by email for an email address. Signing in with a code also covers account recovery, so staff have no passwords.
- **Identities are created by invitation only.** A code is sent only to a contact that already has an identity or a pending invitation. Unknown contacts get the same response, so the endpoint doesn't reveal who is registered. The first sign-in with a code turns every pending invitation for that contact into an `ACTIVE` membership.
- **Platform Super Administrators** sign in with email and a second factor. SMS is not accepted as their second factor.
- The auth provider must support phone and SMS one-time codes and email side by side, on the same identity. SMS delivery must be tested to Hormuud, Somtel, and Telesom numbers before the provider is chosen.

## Consequences

- Better Auth (ADR 0010) requires an email on every user, so a phone-only identity gets a placeholder `<digits>@phone.invalid`. The `.invalid` domain can never receive mail, and code must never display it or send to it (`isPlaceholderEmail`).
- SMS costs money per message. Codes are limited per destination (5 an hour, `code_send_log`) and per IP (Better Auth rate limits stored in the database). A per-School limit on invitations is still to do, in build plan step 3.
- Not decided yet: the SMS provider. Codes are delivered through the `CodeSender` interface. Development prints them to the terminal, and production refuses to start without a real provider.
- Amended 2026-11-25: email sign-in uses a code rather than a link, and staff sign-up is invitation-only.
