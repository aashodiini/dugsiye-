import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      // server-only throws outside a React Server Components build.
      "server-only": path.resolve(import.meta.dirname, "tests/support/server-only.ts"),
    },
  },
  test: {
    globalSetup: ["tests/support/global-setup.ts"],
    setupFiles: ["tests/support/test-env.ts"],
    // Integration tests share one test database.
    fileParallelism: false,
  },
});
