import { randomUUID } from "node:crypto";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/server/auth/auth";
import { sentCodes } from "@/server/auth/senders";
import { disconnectSchoolDb } from "@/server/database/school";
import { createPlatformAdmin, platformAccess, refusesCodeSession } from "@/server/platform/admins";
import { disconnectPlatformDb, platformDb } from "@/server/platform/db";
import { createInvitation } from "@/server/platform/invitations";

// ADR 0007: Platform Super Administrators sign in with email, password, and an
// authenticator app, and one-time codes never get into their accounts.

const run = randomUUID().slice(0, 8);
const email = `admin-${run}@example.com`;
const password = `pw-${randomUUID()}`;
let adminId: string;
let schoolId: string;

function cookieHeaders(response: Response): Headers {
  const cookies = response.headers.getSetCookie().map((c) => c.split(";")[0]);
  return new Headers({ cookie: cookies.join("; ") });
}

async function signInWithPassword() {
  return auth.api.signInEmail({ body: { email, password }, asResponse: true });
}

beforeAll(async () => {
  const passwordHash = await (await auth.$context).password.hash(password);
  ({ userId: adminId } = await createPlatformAdmin({ email, name: "Platform Admin", passwordHash }));
  const school = await platformDb().school.create({
    data: { name: `Admin test ${run}`, slug: `admin-test-${run}`, schoolCode: `AT-${run}`, createdById: adminId },
  });
  schoolId = school.id;
});

afterAll(async () => {
  await disconnectSchoolDb();
  await disconnectPlatformDb();
});

describe("platform administrator sign-in", () => {
  it("must set up two-factor before using the platform area", async () => {
    const response = await signInWithPassword();
    expect(response.status).toBe(200);
    expect(await platformAccess(adminId)).toBe("needs-two-factor");
  });

  it("requires an authenticator code at every sign-in once two-factor is on", async () => {
    const headers = cookieHeaders(await signInWithPassword());
    const enabled = await auth.api.enableTwoFactor({ body: { password }, headers });
    if (enabled.method !== "totp") throw new Error("expected an authenticator-app setup");
    const secret = new URL(enabled.totpURI).searchParams.get("secret")!;
    const otp = createOTP(base32.decode(secret));

    await auth.api.verifyTOTP({ body: { code: await otp.totp() }, headers });
    expect(await platformAccess(adminId)).toBe("granted");

    // A password alone no longer creates a session.
    const again = await signInWithPassword();
    const body = await again.json();
    expect(body.twoFactorRedirect).toBe(true);
    expect(body.token ?? null).toBeNull();

    // The authenticator code completes the sign-in.
    const verified = await auth.api.verifyTOTP({
      body: { code: await otp.totp() },
      headers: cookieHeaders(again),
      asResponse: true,
    });
    expect(verified.status).toBe(200);
  });

  it("rejects a wrong password", async () => {
    const response = await auth.api.signInEmail({
      body: { email, password: "wrong-password" },
      asResponse: true,
    });
    expect(response.status).toBe(401);
  });
});

describe("one-time codes and platform administrators", () => {
  it("never sends a code to a platform administrator, even with an invitation", async () => {
    await createInvitation({
      schoolId,
      contact: { email },
      inviteeName: "Platform Admin",
      role: "SCHOOL_ADMIN",
      invitedById: null,
    });
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    expect(sentCodes.some((c) => c.destination === email)).toBe(false);
  });

  it("refuses a code-based session for a platform administrator only", async () => {
    const staff = await platformDb().user.create({
      data: { id: `staff-${run}`, name: "Staff", email: `staff-${run}@example.com` },
    });
    expect(await refusesCodeSession(adminId, "/sign-in/email-otp")).toBe(true);
    expect(await refusesCodeSession(adminId, "/phone-number/verify")).toBe(true);
    expect(await refusesCodeSession(adminId, "/sign-in/email")).toBe(false);
    expect(await refusesCodeSession(staff.id, "/phone-number/verify")).toBe(false);
  });

  it("denies the platform area to anyone who isn't an administrator", async () => {
    const user = await platformDb().user.create({
      data: { id: `plain-${run}`, name: "Plain", email: `plain-${run}@example.com`, twoFactorEnabled: true },
    });
    expect(await platformAccess(user.id)).toBe("denied");
  });
});
