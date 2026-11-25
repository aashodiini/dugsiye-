-- Invitations are read before anyone has a School context (sign-in looks them
-- up by phone or email through dugsiye_platform, which bypasses RLS), but
-- School-side screens list and revoke them through forSchool(). Protect them
-- like any school-owned table so that path only ever sees its own School.

ALTER TABLE "invitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation" FORCE ROW LEVEL SECURITY;
CREATE POLICY school_isolation ON "invitation"
  USING (school_id = app_current_school())
  WITH CHECK (school_id = app_current_school());

GRANT SELECT, INSERT, UPDATE, DELETE ON "invitation" TO dugsiye_app;
