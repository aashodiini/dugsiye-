import "dotenv/config";
import { execSync } from "node:child_process";

// Bring the test database up to the latest migration before any test runs.
export default function setup() {
  const url = process.env.TEST_MIGRATION_DATABASE_URL;
  if (!url) {
    throw new Error("TEST_MIGRATION_DATABASE_URL is not set (see .env.example)");
  }
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, MIGRATION_DATABASE_URL: url },
  });
}
