import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// The school-scoped client (CONTEXT.md, ADR 0001). This is the only way domain
// code reaches school data. It connects as dugsiye_app, which row-level
// security binds, and every call runs in one transaction that first sets
// app.school_id. Postgres then filters every read, rejects every write for
// another School, and fills school_id on inserts.

export type SchoolDb = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let client: PrismaClient | undefined;

function appClient(): PrismaClient {
  client ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.APP_DATABASE_URL }),
  });
  return client;
}

export async function forSchool<T>(
  schoolId: string,
  work: (db: SchoolDb) => Promise<T>,
  options?: { timeout?: number },
): Promise<T> {
  if (!UUID.test(schoolId)) {
    throw new Error("forSchool: schoolId must be a UUID");
  }
  return appClient().$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.school_id', ${schoolId}, true)`;
      return work(tx);
    },
    { timeout: options?.timeout },
  );
}

export async function disconnectSchoolDb(): Promise<void> {
  await client?.$disconnect();
  client = undefined;
}
