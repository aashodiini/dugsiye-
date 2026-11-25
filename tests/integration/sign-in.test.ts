import { randomInt, randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { auth } from "@/server/auth/auth";
import { sentCodes } from "@/server/auth/senders";
import { disconnectSchoolDb, forSchool } from "@/server/database/school";
import { disconnectPlatformDb, platformDb } from "@/server/platform/db";
import { createInvitation, InvitationError } from "@/server/platform/invitations";

// ADR 0007: invitation-only identities, sign-in by phone or email code, and
// invitations becoming memberships on first sign-in.

const run = randomUUID().slice(0, 8);
const somaliPhone = () => `+25261${randomInt(1_000_000, 9_999_999)}`;
let schoolA: string;
let schoolB: string;
let branchA: string;
let branchB: string;

function lastCodeFor(destination: string): string {
  const sent = sentCodes.filter((c) => c.destination === destination).at(-1);
  if (!sent) throw new Error(`no code sent to ${destination}`);
  return sent.code;
}

async function membershipsOf(userId: string) {
  return platformDb().schoolMembership.findMany({
    where: { userId },
    include: { branches: true },
    orderBy: { createdAt: "asc" },
  });
}

beforeAll(async () => {
  const db = platformDb();
  const creator = await db.user.create({
    data: { id: `creator-${run}`, name: "Platform Admin", email: `creator-${run}@test.local` },
  });
  const make = (tag: string) =>
    db.school.create({
      data: {
        name: `Sign-in ${tag} ${run}`,
        slug: `signin-${tag}-${run}`,
        schoolCode: `SI${tag}-${run}`,
        createdById: creator.id,
        branches: { create: { code: "MAIN", nameSo: "Xarunta", nameEn: "Main" } },
      },
      include: { branches: true },
    });
  const a = await make("a");
  const b = await make("b");
  schoolA = a.id;
  schoolB = b.id;
  branchA = a.branches[0].id;
  branchB = b.branches[0].id;
});

afterAll(async () => {
  await disconnectSchoolDb();
  await disconnectPlatformDb();
});

describe("phone sign-in", () => {
  it("sends no code to a phone number nobody invited, and creates no identity", async () => {
    const phone = somaliPhone();
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    expect(sentCodes.some((c) => c.destination === phone)).toBe(false);

    await expect(
      auth.api.verifyPhoneNumber({ body: { phoneNumber: phone, code: "123456" } }),
    ).rejects.toThrow();
    expect(await platformDb().user.findUnique({ where: { phoneNumber: phone } })).toBeNull();
  });

  it("turns an invitation into an ACTIVE membership on first sign-in", async () => {
    const phone = somaliPhone();
    const invitation = await createInvitation({
      schoolId: schoolA,
      contact: { phoneNumber: phone.replace("+252", "0") }, // typed the local way
      inviteeName: "Faadumo Cali Xasan",
      role: "TEACHER",
      branchIds: [branchA],
      invitedById: null,
    });
    expect(invitation.phoneNumber).toBe(phone);

    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    const result = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: phone, code: lastCodeFor(phone) },
    });

    const user = await platformDb().user.findUniqueOrThrow({ where: { id: result.user!.id } });
    expect(user.phoneNumber).toBe(phone);
    expect(user.email).toBe(`${phone.slice(1)}@phone.invalid`);
    expect(user.name).toBe("Faadumo Cali Xasan");

    const [membership] = await membershipsOf(user.id);
    expect(membership).toMatchObject({ schoolId: schoolA, role: "TEACHER", status: "ACTIVE" });
    expect(membership.branches.map((b) => b.branchId)).toEqual([branchA]);

    const accepted = await platformDb().invitation.findUniqueOrThrow({ where: { id: invitation.id } });
    expect(accepted).toMatchObject({ status: "ACCEPTED", acceptedById: user.id });
  });

  it("rejects a wrong code", async () => {
    const phone = somaliPhone();
    await createInvitation({
      schoolId: schoolA,
      contact: { phoneNumber: phone },
      inviteeName: "Wrong Code",
      role: "REGISTRAR",
      invitedById: null,
    });
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    const wrong = lastCodeFor(phone) === "000000" ? "111111" : "000000";
    await expect(
      auth.api.verifyPhoneNumber({ body: { phoneNumber: phone, code: wrong } }),
    ).rejects.toThrow();
  });

  it("limits how many codes one phone number can be sent per hour", async () => {
    const phone = somaliPhone();
    await createInvitation({
      schoolId: schoolA,
      contact: { phoneNumber: phone },
      inviteeName: "Many Codes",
      role: "ACCOUNTANT",
      invitedById: null,
    });
    for (let i = 0; i < 5; i++) {
      await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    }
    await expect(auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } })).rejects.toThrow(
      /Too many codes/,
    );
    expect(sentCodes.filter((c) => c.destination === phone)).toHaveLength(5);
  });

  it("adds a second School's membership to an existing identity at next sign-in", async () => {
    const phone = somaliPhone();
    await createInvitation({
      schoolId: schoolA,
      contact: { phoneNumber: phone },
      inviteeName: "Two Schools",
      role: "TEACHER",
      branchIds: [branchA],
      invitedById: null,
    });
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    const first = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: phone, code: lastCodeFor(phone) },
    });

    await createInvitation({
      schoolId: schoolB,
      contact: { phoneNumber: phone },
      inviteeName: "Two Schools",
      role: "SCHOOL_ADMIN",
      invitedById: null,
    });
    await auth.api.sendPhoneNumberOTP({ body: { phoneNumber: phone } });
    const second = await auth.api.verifyPhoneNumber({
      body: { phoneNumber: phone, code: lastCodeFor(phone) },
    });

    expect(second.user!.id).toBe(first.user!.id);
    const memberships = await membershipsOf(first.user!.id);
    expect(memberships.map((m) => [m.schoolId, m.role])).toEqual([
      [schoolA, "TEACHER"],
      [schoolB, "SCHOOL_ADMIN"],
    ]);
    // The School B membership is visible from School B only.
    const fromA = await forSchool(schoolA, (db) =>
      db.schoolMembership.findMany({ where: { userId: first.user!.id } }),
    );
    expect(fromA.map((m) => m.schoolId)).toEqual([schoolA]);
  });
});

describe("email sign-in", () => {
  it("signs in an invited email address with a code", async () => {
    const email = `Registrar-${run}@Example.com`;
    await createInvitation({
      schoolId: schoolB,
      contact: { email },
      inviteeName: "Email Registrar",
      role: "REGISTRAR",
      branchIds: [branchB],
      invitedById: null,
    });
    const normalized = email.toLowerCase();
    await auth.api.sendVerificationOTP({ body: { email: normalized, type: "sign-in" } });
    const result = await auth.api.signInEmailOTP({
      body: { email: normalized, otp: lastCodeFor(normalized) },
    });

    const [membership] = await membershipsOf(result.user.id);
    expect(membership).toMatchObject({ schoolId: schoolB, role: "REGISTRAR", status: "ACTIVE" });
  });

  it("sends no code to an email nobody invited", async () => {
    const email = `stranger-${run}@example.com`;
    await auth.api.sendVerificationOTP({ body: { email, type: "sign-in" } });
    expect(sentCodes.some((c) => c.destination === email)).toBe(false);
  });
});

describe("createInvitation", () => {
  it("refuses a Branch list for a School Administrator", async () => {
    await expect(
      createInvitation({
        schoolId: schoolA,
        contact: { phoneNumber: somaliPhone() },
        inviteeName: "Admin",
        role: "SCHOOL_ADMIN",
        branchIds: [branchA],
        invitedById: null,
      }),
    ).rejects.toThrow(new InvitationError("SCHOOL_ADMIN_IS_SCHOOL_WIDE"));
  });

  it("refuses a Branch from another School", async () => {
    await expect(
      createInvitation({
        schoolId: schoolA,
        contact: { phoneNumber: somaliPhone() },
        inviteeName: "Teacher",
        role: "TEACHER",
        branchIds: [branchB],
        invitedById: null,
      }),
    ).rejects.toThrow(new InvitationError("BRANCH_NOT_IN_SCHOOL"));
  });

  it("refuses something that isn't a phone number", async () => {
    await expect(
      createInvitation({
        schoolId: schoolA,
        contact: { phoneNumber: "not a phone" },
        inviteeName: "Teacher",
        role: "TEACHER",
        invitedById: null,
      }),
    ).rejects.toThrow(new InvitationError("INVALID_CONTACT"));
  });
});
