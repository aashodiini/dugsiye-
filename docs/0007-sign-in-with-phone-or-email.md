# ADR 0007: Sign in with a phone number or an email address

- Status: Accepted
- Date: 2026-10-25
- Amends: the email-based invitation and recovery flow in Technical Specification v1.0, §3.1

## Context

Many school staff in Somalia use a phone number every day but rarely check email, and some have no email address at all. An invitation flow that only uses email would shut them out.

## Decision

- A person's central identity has a **phone number**, an **email address**, or both. At least one is required. Phone numbers are stored in E.164 format (for example `+252612345678`). Email addresses are stored lowercased. Each is unique across the Platform when present.
- School staff are invited **by phone by default**. The invitation and account recovery are sent to whichever contact the invitation used: an SMS one-time code for a phone, a link for an email.
- **Platform Super Administrators** sign in with email and a second factor. SMS is not accepted as their second factor.
- The auth provider must support phone and SMS one-time codes and email side by side, on the same identity. SMS delivery must be tested to Hormuud, Somtel, and Telesom numbers before the provider is chosen.

## Consequences

- `PlatformUser.email` becomes nullable, a `phone` column is added, and a check requires at least one of the two.
- SMS costs money per message. Invitation and code-request endpoints need rate limits per phone number and per School, both to control cost and to prevent SMS flooding.
- Not decided yet: the auth provider and the SMS provider.
