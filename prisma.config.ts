import "dotenv/config";
import { defineConfig } from "prisma/config";

// Migrations run as the table owner (dugsiye_owner). The running app never
// uses this URL; it uses APP_DATABASE_URL and PLATFORM_DATABASE_URL.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["MIGRATION_DATABASE_URL"],
  },
});
