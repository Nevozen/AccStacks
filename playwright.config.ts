import "dotenv/config";
import { defineConfig } from "@playwright/test";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl || !new URL(testDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must point to an isolated database ending in _test");
}
// Test workers import database fixtures outside the web server's environment.
process.env.DATABASE_URL = testDatabaseUrl;

const baseURL = "http://localhost:3100";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm build && node scripts/prepare-standalone.mjs && node .next/standalone/server.js",
    url: `${baseURL}/login`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDatabaseUrl,
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-auth-secret-not-for-production-use",
      AUTH_URL: baseURL,
      PORT: "3100",
      HOSTNAME: "localhost",
    },
  },
});
