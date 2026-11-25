-- Sign-in (ADR 0007): Better Auth tables, invitations, and the send log for
-- per-destination code limits. All tables here are platform tables (no
-- school_id policy): the auth library and platform services reach them
-- through dugsiye_platform.

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CodeChannel" AS ENUM ('SMS', 'EMAIL');

-- AlterEnum
BEGIN;
CREATE TYPE "MembershipStatus_new" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');
ALTER TABLE "public"."school_membership" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "school_membership" ALTER COLUMN "status" TYPE "MembershipStatus_new" USING ("status"::text::"MembershipStatus_new");
ALTER TYPE "MembershipStatus" RENAME TO "MembershipStatus_old";
ALTER TYPE "MembershipStatus_new" RENAME TO "MembershipStatus";
DROP TYPE "public"."MembershipStatus_old";
ALTER TABLE "school_membership" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "school_membership" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "two_factor" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backup_codes" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failed_verification_count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(3),

    CONSTRAINT "two_factor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "last_request" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "phone_number" TEXT,
    "email" TEXT,
    "invitee_name" TEXT NOT NULL,
    "role" "SchoolRole" NOT NULL,
    "branch_ids" UUID[],
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by_id" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_by_id" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "code_send_log" (
    "id" UUID NOT NULL,
    "channel" "CodeChannel" NOT NULL,
    "destination" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "code_send_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "two_factor_user_id_idx" ON "two_factor"("user_id");

-- CreateIndex
CREATE INDEX "two_factor_secret_idx" ON "two_factor"("secret");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "invitation_phone_number_status_idx" ON "invitation"("phone_number", "status");

-- CreateIndex
CREATE INDEX "invitation_email_status_idx" ON "invitation"("email", "status");

-- CreateIndex
CREATE INDEX "code_send_log_destination_sent_at_idx" ON "code_send_log"("destination", "sent_at");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "school"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ---------------------------------------------------------------------------
-- Invitation rules
-- ---------------------------------------------------------------------------

UPDATE "invitation" SET "branch_ids" = '{}' WHERE "branch_ids" IS NULL;
ALTER TABLE "invitation" ALTER COLUMN "branch_ids" SET DEFAULT '{}';
ALTER TABLE "invitation" ALTER COLUMN "branch_ids" SET NOT NULL;

-- Sent to exactly one contact.
ALTER TABLE "invitation" ADD CONSTRAINT invitation_one_contact
  CHECK ((phone_number IS NULL) <> (email IS NULL));
ALTER TABLE "invitation" ADD CONSTRAINT invitation_phone_e164
  CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9][0-9]{7,14}$');
ALTER TABLE "invitation" ADD CONSTRAINT invitation_email_lowercase
  CHECK (email IS NULL OR email = lower(email));

-- SCHOOL_ADMIN is always School-wide (ADR 0004).
ALTER TABLE "invitation" ADD CONSTRAINT invitation_admin_school_wide
  CHECK (role <> 'SCHOOL_ADMIN' OR cardinality(branch_ids) = 0);

ALTER TABLE "invitation" ADD CONSTRAINT invitation_accepted_fields
  CHECK ((status = 'ACCEPTED') = (accepted_at IS NOT NULL));

-- At most one pending invitation per contact per School.
CREATE UNIQUE INDEX invitation_one_pending_phone
  ON "invitation" (school_id, phone_number) WHERE status = 'PENDING' AND phone_number IS NOT NULL;
CREATE UNIQUE INDEX invitation_one_pending_email
  ON "invitation" (school_id, email) WHERE status = 'PENDING' AND email IS NOT NULL;

ALTER TABLE "user" ADD CONSTRAINT user_phone_e164
  CHECK (phone_number IS NULL OR phone_number ~ '^\+[1-9][0-9]{7,14}$');

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE
  ON "session", "account", "verification", "two_factor", "rate_limit", "invitation", "code_send_log"
  TO dugsiye_platform;

-- Future platform tables are granted to dugsiye_platform automatically.
-- dugsiye_app is never granted by default: each school-owned table grants it
-- explicitly alongside its RLS policy.
ALTER DEFAULT PRIVILEGES FOR ROLE dugsiye_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dugsiye_platform;
