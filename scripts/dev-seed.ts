// Development data: a demo School with two Branches and pending invitations
// you can sign in with. Safe to run repeatedly. Never run against production.
//
//   npm run db:seed
//
// Then open http://localhost:3000/sign-in and use one of the printed contacts.
// The sign-in code is printed in the terminal running `npm run dev`.

import "dotenv/config";
import { disconnectSchoolDb } from "@/server/database/school";
import { disconnectPlatformDb, platformDb } from "@/server/platform/db";
import { createInvitation, hasPendingInvitation } from "@/server/platform/invitations";

const SEED_USER_ID = "dev-seed";

const INVITES = [
  { phoneNumber: "+252610000001", name: "Cabdi Maxamed Cali", role: "SCHOOL_ADMIN", branches: [] },
  { phoneNumber: "+252610000002", name: "Faadumo Xasan Nuur", role: "TEACHER", branches: ["HODAN"] },
  { phoneNumber: "+252610000003", name: "Axmed Yuusuf Warsame", role: "ACCOUNTANT", branches: ["WADAJIR"] },
] as const;

async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("dev-seed refuses to run in production");
  const db = platformDb();

  await db.user.upsert({
    where: { id: SEED_USER_ID },
    update: {},
    create: { id: SEED_USER_ID, name: "Dev Seed", email: "dev-seed@dugsiye.invalid" },
  });

  const school = await db.school.upsert({
    where: { slug: "dugsiga-horseed" },
    update: {},
    create: {
      name: "Dugsiga Horseed",
      slug: "dugsiga-horseed",
      schoolCode: "HORSEED",
      createdById: SEED_USER_ID,
      branches: {
        create: [
          { code: "HODAN", nameSo: "Laanta Hodan", nameEn: "Hodan Branch" },
          { code: "WADAJIR", nameSo: "Laanta Wadajir", nameEn: "Wadajir Branch" },
        ],
      },
    },
    include: { branches: true },
  });
  const branchId = (code: string) => school.branches.find((b) => b.code === code)!.id;

  for (const invite of INVITES) {
    const contact = { phoneNumber: invite.phoneNumber };
    const member = await db.schoolMembership.findFirst({
      where: { schoolId: school.id, user: { phoneNumber: invite.phoneNumber } },
    });
    if (!member && !(await hasPendingInvitation(contact))) {
      await createInvitation({
        schoolId: school.id,
        contact,
        inviteeName: invite.name,
        role: invite.role,
        branchIds: invite.branches.map(branchId),
        invitedById: SEED_USER_ID,
      });
    }
    console.log(`${invite.role.padEnd(12)} ${invite.phoneNumber}  ${invite.name}`);
  }
  console.log(`\nSchool: ${school.name}. Sign in at http://localhost:3000/sign-in`);
}

main()
  .finally(async () => {
    await disconnectSchoolDb();
    await disconnectPlatformDb();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
