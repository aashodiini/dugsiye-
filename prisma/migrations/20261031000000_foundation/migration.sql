-- Foundation: platform registry, Branches, memberships, and row-level
-- security (ADR 0001). Roles dugsiye_app and dugsiye_platform are created
-- once per database server by scripts/db/setup.sql.

-- The School set for the current transaction by forSchool(), or NULL.
-- set_config(..., true) is reset to '' (not NULL) after a transaction ends,
-- hence the NULLIF.
CREATE FUNCTION app_current_school() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.school_id', true), '')::uuid $$;

-- CreateEnum
CREATE TYPE "Locale" AS ENUM ('so', 'en');

-- CreateEnum
CREATE TYPE "SchoolStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SchoolRole" AS ENUM ('SCHOOL_ADMIN', 'REGISTRAR', 'ACCOUNTANT', 'TEACHER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REVOKED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone_number" TEXT,
    "phone_number_verified" BOOLEAN NOT NULL DEFAULT false,
    "preferred_locale" "Locale" NOT NULL DEFAULT 'so',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_administrator" (
    "user_id" TEXT NOT NULL,
    "granted_by_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_administrator_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "school" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "school_code" TEXT NOT NULL,
    "status" "SchoolStatus" NOT NULL DEFAULT 'ACTIVE',
    "default_locale" "Locale" NOT NULL DEFAULT 'so',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Mogadishu',
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branch" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL DEFAULT app_current_school(),
    "code" TEXT NOT NULL,
    "name_so" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_membership" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL DEFAULT app_current_school(),
    "user_id" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "invited_by_id" TEXT,
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_branch" (
    "school_id" UUID NOT NULL DEFAULT app_current_school(),
    "membership_id" UUID NOT NULL,
    "branch_id" UUID NOT NULL,

    CONSTRAINT "membership_branch_pkey" PRIMARY KEY ("membership_id","branch_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "user"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "school_slug_key" ON "school"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "school_school_code_key" ON "school"("school_code");

-- CreateIndex
CREATE UNIQUE INDEX "branch_school_id_id_key" ON "branch"("school_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "branch_school_id_code_key" ON "branch"("school_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "school_membership_user_id_school_id_key" ON "school_membership"("user_id", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "school_membership_school_id_id_key" ON "school_membership"("school_id", "id");

-- AddForeignKey
ALTER TABLE "platform_administrator" ADD CONSTRAINT "platform_administrator_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_administrator" ADD CONSTRAINT "platform_administrator_granted_by_id_fkey" FOREIGN KEY ("granted_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school" ADD CONSTRAINT "school_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "branch" ADD CONSTRAINT "branch_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_membership" ADD CONSTRAINT "school_membership_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_membership" ADD CONSTRAINT "school_membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_branch" ADD CONSTRAINT "membership_branch_school_id_membership_id_fkey" FOREIGN KEY ("school_id", "membership_id") REFERENCES "school_membership"("school_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_branch" ADD CONSTRAINT "membership_branch_school_id_branch_id_fkey" FOREIGN KEY ("school_id", "branch_id") REFERENCES "branch"("school_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Row-level security on school-owned tables
-- ---------------------------------------------------------------------------

ALTER TABLE "branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "branch" FORCE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "branch"
  USING (school_id = app_current_school())
  WITH CHECK (school_id = app_current_school());

ALTER TABLE "school_membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "school_membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "school_membership"
  USING (school_id = app_current_school())
  WITH CHECK (school_id = app_current_school());

ALTER TABLE "membership_branch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membership_branch" FORCE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "membership_branch"
  USING (school_id = app_current_school())
  WITH CHECK (school_id = app_current_school());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

-- dugsiye_app is bound by RLS and sees school-owned tables only.
GRANT USAGE ON SCHEMA public TO dugsiye_app;
GRANT EXECUTE ON FUNCTION app_current_school() TO dugsiye_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON "branch", "school_membership", "membership_branch" TO dugsiye_app;

-- dugsiye_platform has BYPASSRLS and serves platform services only.
GRANT USAGE ON SCHEMA public TO dugsiye_platform;
GRANT EXECUTE ON FUNCTION app_current_school() TO dugsiye_platform;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dugsiye_platform;
