import "server-only";
import { z } from "zod";
import { forSchool } from "@/server/database/school";
import { platformDb } from "@/server/platform/db";
import { isE164, isPlaceholderEmail, normalizeEmail, normalizePhone } from "@/server/auth/identity";

// Invitations (CONTEXT.md: Membership). An invitation offers one role at one
// School to a phone number or email address. Nobody can create an identity
// without one, and the first time that contact signs in with a code, every
// pending invitation for it becomes an ACTIVE membership.
//
// Callers are responsible for checking that the inviter may invite to this
// School and role. That check belongs to the School administration service
// (build plan step 3).

const INVITATION_DAYS = 7;

export type Contact = { phoneNumber: string } | { email: string };

const createInput = z.object({
  schoolId: z.uuid(),
  contact: z.union([
    z.object({ phoneNumber: z.string() }),
    z.object({ email: z.email() }),
  ]),
  inviteeName: z.string().trim().min(1).max(200),
  role: z.enum(["SCHOOL_ADMIN", "REGISTRAR", "ACCOUNTANT", "TEACHER"]),
  branchIds: z.array(z.uuid()).default([]),
  invitedById: z.string().nullable(),
});

export class InvitationError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}

export async function createInvitation(input: z.input<typeof createInput>) {
  const data = createInput.parse(input);
  const contact = normalizeContact(data.contact);
  if (!contact) throw new InvitationError("INVALID_CONTACT");

  if (data.role === "SCHOOL_ADMIN" && data.branchIds.length > 0) {
    throw new InvitationError("SCHOOL_ADMIN_IS_SCHOOL_WIDE");
  }

  const db = platformDb();
  const school = await db.school.findUnique({ where: { id: data.schoolId } });
  if (!school || school.status === "ARCHIVED") throw new InvitationError("SCHOOL_NOT_FOUND");

  const branchCount = await db.branch.count({
    where: { schoolId: data.schoolId, id: { in: data.branchIds } },
  });
  if (branchCount !== new Set(data.branchIds).size) throw new InvitationError("BRANCH_NOT_IN_SCHOOL");

  return db.invitation.create({
    data: {
      schoolId: data.schoolId,
      ...contact,
      inviteeName: data.inviteeName,
      role: data.role,
      branchIds: [...new Set(data.branchIds)],
      invitedById: data.invitedById,
      expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

function normalizeContact(contact: Contact): Contact | null {
  if ("phoneNumber" in contact) {
    const phoneNumber = normalizePhone(contact.phoneNumber);
    return phoneNumber ? { phoneNumber } : null;
  }
  const email = normalizeEmail(contact.email);
  return isPlaceholderEmail(email) ? null : { email };
}

function pendingFor(contact: Contact) {
  return {
    ...contact,
    status: "PENDING" as const,
    expiresAt: { gt: new Date() },
    school: { status: { not: "ARCHIVED" as const } },
  };
}

export async function hasPendingInvitation(contact: Contact): Promise<boolean> {
  return (await platformDb().invitation.count({ where: pendingFor(contact) })) > 0;
}

// May this contact receive a sign-in code? Only if it belongs to an identity
// or has a pending invitation. Codes are never sent to unknown contacts.
export async function isKnownContact(contact: Contact): Promise<boolean> {
  const db = platformDb();
  const user =
    "phoneNumber" in contact
      ? await db.user.findUnique({ where: { phoneNumber: contact.phoneNumber } })
      : await db.user.findUnique({ where: { email: contact.email } });
  return user !== null || (await hasPendingInvitation(contact));
}

// Turns every pending invitation for the user's verified contacts into a
// membership. Safe to call on every sign-in: it does nothing when there is
// nothing pending, and an existing membership is never changed (a REVOKED or
// SUSPENDED one stays that way; the invitation is still marked accepted).
export async function acceptPendingInvitations(userId: string): Promise<number> {
  const db = platformDb();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const contacts: Contact[] = [];
  if (user.phoneNumber && user.phoneNumberVerified && isE164(user.phoneNumber)) {
    contacts.push({ phoneNumber: user.phoneNumber });
  }
  if (user.emailVerified && !isPlaceholderEmail(user.email)) contacts.push({ email: user.email });
  if (contacts.length === 0) return 0;

  const invitations = await db.invitation.findMany({
    where: {
      OR: contacts.map(pendingFor),
      school: { status: "ACTIVE" },
    },
    orderBy: { createdAt: "asc" },
  });

  let accepted = 0;
  for (const invitation of invitations) {
    await forSchool(invitation.schoolId, async (school) => {
      const existing = await school.schoolMembership.findUnique({
        where: { userId_schoolId: { userId, schoolId: invitation.schoolId } },
      });
      if (!existing) {
        await school.schoolMembership.create({
          data: {
            userId,
            role: invitation.role,
            status: "ACTIVE",
            invitedById: invitation.invitedById,
            activatedAt: new Date(),
            branches: { create: invitation.branchIds.map((branchId) => ({ branchId })) },
          },
        });
      }
    });
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedById: userId, acceptedAt: new Date() },
    });
    accepted++;
  }

  // Phone-only identities start with the phone number as their name.
  if (accepted > 0 && user.name === user.phoneNumber) {
    await db.user.update({ where: { id: userId }, data: { name: invitations[0].inviteeName } });
  }
  return accepted;
}
