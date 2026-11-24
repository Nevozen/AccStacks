import "dotenv/config";
import { randomUUID } from "node:crypto";
import { createPrismaClient } from "@/server/db";

const connectionString = process.env.TEST_DATABASE_URL;
if (!connectionString || !new URL(connectionString).pathname.endsWith("_test")) {
  throw new Error("TEST_DATABASE_URL must point to an isolated database ending in _test");
}

export const testDb = createPrismaClient(connectionString);

export async function createTestUser() {
  const suffix = randomUUID();
  return testDb.user.create({
    data: {
      email: `test-${suffix}@example.invalid`,
      name: "Integration Test User",
      passwordHash: `not-a-login-password-${suffix}`,
      settings: { create: {} },
    },
  });
}
