// Creates a Platform Super Administrator: an identity with an email, a
// generated password, and the platform role. Run it on the server, never
// through the web app:
//
//   npm run platform:admin -- --email you@example.com --name "Your Name"
//
// The password is printed once. Sign in at /platform/sign-in; you'll be asked
// to set up an authenticator app before you can use the platform area.

import "dotenv/config";
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { auth } from "@/server/auth/auth";
import { normalizeEmail } from "@/server/auth/identity";
import { disconnectSchoolDb } from "@/server/database/school";
import { createPlatformAdmin } from "@/server/platform/admins";
import { disconnectPlatformDb, platformDb } from "@/server/platform/db";

async function main() {
  const { values } = parseArgs({
    options: { email: { type: "string" }, name: { type: "string" } },
  });
  if (!values.email || !values.name) {
    throw new Error('Usage: npm run platform:admin -- --email you@example.com --name "Your Name"');
  }
  const email = normalizeEmail(values.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Not an email address: ${email}`);
  if (await platformDb().user.findUnique({ where: { email } })) {
    throw new Error(`An identity with ${email} already exists`);
  }

  const password = randomBytes(18).toString("base64url");
  const passwordHash = await (await auth.$context).password.hash(password);
  await createPlatformAdmin({ email, name: values.name.trim(), passwordHash });

  console.log(`Platform Super Administrator created: ${email}`);
  console.log(`Password (shown once, store it safely): ${password}`);
  console.log("Sign in at /platform/sign-in, then set up your authenticator app.");
}

main()
  .finally(async () => {
    await disconnectSchoolDb();
    await disconnectPlatformDb();
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
