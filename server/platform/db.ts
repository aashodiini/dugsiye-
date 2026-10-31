import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The platform client connects as dugsiye_platform, which bypasses row-level
// security. Only platform services (the School registry, sign-in membership
// lookups, Platform Super Administrator work) may import it. Domain modules use
// forSchool() from server/database/school.ts instead.

let client: PrismaClient | undefined;

export function platformDb(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.PLATFORM_DATABASE_URL }),
  });
  return client;
}

export async function disconnectPlatformDb(): Promise<void> {
  await client?.$disconnect();
  client = undefined;
}
