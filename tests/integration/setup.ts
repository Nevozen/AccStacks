import "dotenv/config";
import path from "node:path";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl || !new URL(testDatabaseUrl).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must point to an isolated database ending in _test");
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.ACCSTACKS_UPLOAD_DIR = path.join(
  import.meta.dirname,
  "..",
  "..",
  ".data",
  "test-uploads",
  "integration",
);
process.env.AUTH_SECRET ??= "integration-only-auth-secret-not-for-production";
