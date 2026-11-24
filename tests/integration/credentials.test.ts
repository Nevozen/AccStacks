import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { afterAll, describe, expect, it } from "vitest";
import { verifyCredentials } from "@/server/credentials";
import { db } from "@/server/db";
import { testDb } from "./client";

async function createLoginUser() {
  const email = `login-${randomUUID()}@example.invalid`;
  const password = "correct-horse-battery-staple";
  const user = await testDb.user.create({
    data: {
      email,
      name: "Login Test",
      passwordHash: await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      }),
    },
  });
  return { user, email, password };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("credential authentication", () => {
  it("accepts valid credentials and rejects an incorrect password", async () => {
    const { user, email, password } = await createLoginUser();
    const client = randomUUID();

    await expect(verifyCredentials({ email, password: "incorrect" }, client)).resolves.toBeNull();
    await expect(verifyCredentials({ email, password }, client)).resolves.toEqual({
      id: user.id,
      name: user.name,
      email,
    });
  });

  it("normalizes email and throttles repeated failures", async () => {
    const { email, password } = await createLoginUser();
    const client = randomUUID();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await verifyCredentials({ email, password: "incorrect" }, client);
    }

    await expect(verifyCredentials({ email, password }, client)).resolves.toBeNull();
    await expect(
      verifyCredentials({ email: email.toUpperCase(), password }, randomUUID()),
    ).resolves.toMatchObject({ email });
  });
});
