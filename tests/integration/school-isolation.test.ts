import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { disconnectSchoolDb, forSchool } from "@/server/database/school";
import { disconnectPlatformDb, platformDb } from "@/server/platform/db";

// ADR 0001: no School can read or change another School's data, and Postgres
// enforces it even when application code gets it wrong.

const run = randomUUID().slice(0, 8);
let schoolA: string;
let schoolB: string;
let branchA: string;
let branchB: string;
let membershipA: string;

beforeAll(async () => {
  const db = platformDb();
  const user = await db.user.create({
    data: { id: `user-${run}`, name: "Test Admin", email: `admin-${run}@test.local` },
  });
  const make = (tag: string) =>
    db.school.create({
      data: {
        name: `School ${tag} ${run}`,
        slug: `school-${tag}-${run}`,
        schoolCode: `${tag}-${run}`,
        createdById: user.id,
        branches: { create: { code: "MAIN", nameSo: "Xarunta", nameEn: "Main" } },
        memberships: { create: { userId: user.id, role: "SCHOOL_ADMIN", status: "ACTIVE" } },
      },
      include: { branches: true, memberships: true },
    });
  const a = await make("a");
  const b = await make("b");
  schoolA = a.id;
  schoolB = b.id;
  branchA = a.branches[0].id;
  branchB = b.branches[0].id;
  membershipA = a.memberships[0].id;
});

afterAll(async () => {
  await disconnectSchoolDb();
  await disconnectPlatformDb();
});

describe("forSchool", () => {
  it("reads only the current School's rows", async () => {
    const branches = await forSchool(schoolA, (db) => db.branch.findMany());
    expect(branches.map((b) => b.id)).toEqual([branchA]);
  });

  it("cannot find another School's row by id", async () => {
    const found = await forSchool(schoolA, (db) =>
      db.branch.findUnique({ where: { id: branchB } }),
    );
    expect(found).toBeNull();
  });

  it("cannot update or delete another School's rows", async () => {
    const updated = await forSchool(schoolA, (db) =>
      db.branch.updateMany({ where: { id: branchB }, data: { nameEn: "Hijacked" } }),
    );
    const deleted = await forSchool(schoolA, (db) =>
      db.membershipBranch.deleteMany({ where: { branchId: branchB } }),
    );
    expect(updated.count).toBe(0);
    expect(deleted.count).toBe(0);
    const b = await platformDb().branch.findUniqueOrThrow({ where: { id: branchB } });
    expect(b.nameEn).toBe("Main");
  });

  it("fills school_id on insert from the transaction's School", async () => {
    const created = await forSchool(schoolA, (db) =>
      db.branch.create({
        data: { code: `X-${run}`, nameSo: "Laan", nameEn: "Branch" },
      }),
    );
    expect(created.schoolId).toBe(schoolA);
  });

  it("rejects an insert that names another School", async () => {
    await expect(
      forSchool(schoolA, (db) =>
        db.branch.create({
          data: { schoolId: schoolB, code: `Y-${run}`, nameSo: "Laan", nameEn: "Branch" },
        }),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("rejects a non-UUID School id before touching the database", async () => {
    await expect(forSchool("' OR 1=1 --", (db) => db.branch.findMany())).rejects.toThrow(
      /must be a UUID/,
    );
  });
});

describe("composite foreign keys", () => {
  it("cannot link one School's membership to another School's Branch", async () => {
    // Even the platform client, which bypasses RLS, cannot create the link.
    await expect(
      platformDb().membershipBranch.create({
        data: { schoolId: schoolA, membershipId: membershipA, branchId: branchB },
      }),
    ).rejects.toThrow();
  });
});

describe("database setup", () => {
  it("protects every table that has a school_id column", async () => {
    const unprotected = await platformDb().$queryRaw<{ table: string }[]>`
      SELECT c.relname AS table
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'school_id' AND NOT a.attisdropped
      WHERE c.relkind = 'r'
        AND (NOT c.relrowsecurity
             OR NOT c.relforcerowsecurity
             OR NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid))`;
    expect(unprotected).toEqual([]);
  });

  it("does not let the app role bypass row-level security", async () => {
    const [role] = await platformDb().$queryRaw<{ bypass: boolean; superuser: boolean }[]>`
      SELECT rolbypassrls AS bypass, rolsuper AS superuser FROM pg_roles WHERE rolname = 'dugsiye_app'`;
    expect(role).toEqual({ bypass: false, superuser: false });
  });

  it("does not give the app role access to platform tables", async () => {
    const grants = await platformDb().$queryRaw<{ table: string }[]>`
      SELECT DISTINCT table_name AS table FROM information_schema.role_table_grants
      WHERE grantee = 'dugsiye_app' AND table_name IN ('school', 'user', 'platform_administrator')`;
    expect(grants).toEqual([]);
  });
});
