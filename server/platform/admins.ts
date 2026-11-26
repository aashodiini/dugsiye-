import "server-only";
import { randomUUID } from "node:crypto";
import { platformDb } from "@/server/platform/db";
import type { Contact } from "@/server/platform/invitations";

// Platform Super Administrators (CONTEXT.md, ADR 0007). They sign in only with
// email, password, and an authenticator app. One-time codes, which school staff
// use, would skip both the password and the authenticator, so:
// - codes are never sent to a platform administrator's email or phone, and
// - a session created from a code is refused for a platform administrator.

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  return (await platformDb().platformAdministrator.count({ where: { userId } })) > 0;
}

export async function isPlatformAdminContact(contact: Contact): Promise<boolean> {
  const user = "phoneNumber" in contact ? { phoneNumber: contact.phoneNumber } : { email: contact.email };
  return (await platformDb().platformAdministrator.count({ where: { user } })) > 0;
}

// Sign-in routes that create a session from a one-time code. The two-factor
// plugin only guards password sign-in, so these bypass it.
const CODE_SIGN_IN_PATHS = new Set(["/sign-in/email-otp", "/phone-number/verify"]);

export async function refusesCodeSession(userId: string, path: string | undefined): Promise<boolean> {
  return path !== undefined && CODE_SIGN_IN_PATHS.has(path) && (await isPlatformAdmin(userId));
}

export type PlatformAccess = "granted" | "needs-two-factor" | "denied";

// Platform pages require the administrator to have finished setting up two-factor.
export async function platformAccess(userId: string): Promise<PlatformAccess> {
  const user = await platformDb().user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, platformAdmin: { select: { userId: true } } },
  });
  if (!user?.platformAdmin) return "denied";
  return user.twoFactorEnabled ? "granted" : "needs-two-factor";
}

// Creates an administrator's identity, password credential, and platform role
// in one transaction. Used by scripts/create-platform-admin.ts, never by a web
// request. The caller hashes the password with Better Auth's hasher.
export async function createPlatformAdmin(input: {
  email: string;
  name: string;
  passwordHash: string;
  grantedById?: string;
}): Promise<{ userId: string }> {
  const db = platformDb();
  const userId = randomUUID();
  await db.$transaction([
    db.user.create({ data: { id: userId, name: input.name, email: input.email, emailVerified: true } }),
    db.account.create({
      data: {
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: input.passwordHash,
      },
    }),
    db.platformAdministrator.create({ data: { userId, grantedById: input.grantedById } }),
  ]);
  return { userId };
}
