-- One-time setup for a development machine. Run as the postgres superuser:
--
--   psql -U postgres -v owner_pw=... -v app_pw=... -v platform_pw=... -f scripts/db/setup.sql
--
-- Roles (ADR 0001):
--   dugsiye_owner     owns the tables and runs migrations; never used by the app
--   dugsiye_app       bound by row-level security; used only through forSchool()
--   dugsiye_platform  BYPASSRLS; used only by platform services

CREATE ROLE dugsiye_owner LOGIN CREATEDB PASSWORD :'owner_pw';
CREATE ROLE dugsiye_app LOGIN NOBYPASSRLS PASSWORD :'app_pw';
CREATE ROLE dugsiye_platform LOGIN BYPASSRLS PASSWORD :'platform_pw';

CREATE DATABASE dugsiye_dev OWNER dugsiye_owner;
CREATE DATABASE dugsiye_test OWNER dugsiye_owner;

\connect dugsiye_dev
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO dugsiye_owner;

\connect dugsiye_test
REVOKE ALL ON SCHEMA public FROM PUBLIC;
ALTER SCHEMA public OWNER TO dugsiye_owner;
