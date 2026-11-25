import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { createThrottleKey, reserveRegistrationAttempt } from "@/server/auth-throttle";
import { verifyCredentials } from "@/server/credentials";
import { db } from "@/server/db";
import { registerUser } from "@/services/registration";
import { chooseCurrency, updateCapital } from "@/services/settings";
import { testDb } from "./client";

function signupInput() {
  const password = "local-test-strong-password";
  return {
    name: "  New Reseller ",
    email: `sign-up-${randomUUID()}@example.invalid`,
    password,
    confirmPassword: password,
  };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("registration", () => {
  it("rejects invalid passwords and provisions valid credentials with private settings", async () => {
    const input = signupInput();
    const client = randomUUID();
    await expect(
      registerUser({ ...input, password: "short", confirmPassword: "short" }, client),
    ).rejects.toMatchObject({ name: "ZodError" });
    await expect(
      registerUser({ ...input, confirmPassword: "a-different-password" }, client),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect(await testDb.user.findUnique({ where: { email: input.email } })).toBeNull();

    const user = await registerUser({ ...input, email: ` ${input.email.toUpperCase()} ` }, client);
    expect(user.email).toBe(input.email);
    expect(await testDb.userSettings.findUnique({ where: { userId: user.id } })).toMatchObject({
      theme: "LIGHT",
      currency: null,
      timezone: "Asia/Jakarta",
      capital: null,
    });
    await expect(verifyCredentials(input, client)).resolves.toEqual({
      id: user.id,
      email: input.email,
      name: "New Reseller",
    });
  });

  it("requires currency before recording capital and never relabels an existing balance", async () => {
    const user = await registerUser(signupInput(), randomUUID());
    await expect(updateCapital(user.id, "100")).rejects.toThrow(
      "Choose your workspace currency first",
    );
    await expect(chooseCurrency(user.id, "EUR")).rejects.toMatchObject({ name: "ZodError" });
    await chooseCurrency(user.id, "USD");
    await updateCapital(user.id, "100.25");
    await expect(chooseCurrency(user.id, "IDR")).rejects.toThrow("already set");
    expect(await testDb.userSettings.findUnique({ where: { userId: user.id } })).toMatchObject({
      currency: "USD",
      capital: 10_025n,
    });
  });

  it("creates only one user for concurrent signups and never overwrites their credentials", async () => {
    const input = signupInput();
    const results = await Promise.allSettled([
      registerUser(input, randomUUID()),
      registerUser({ ...input, email: input.email.toUpperCase() }, randomUUID()),
    ]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect(results).toContainEqual({
      status: "rejected",
      reason: expect.objectContaining({ code: "CONFLICT" }),
    });

    const password = "attempted-replacement-password";
    await expect(
      registerUser(
        { ...input, name: "Replacement", password, confirmPassword: password },
        randomUUID(),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    const client = randomUUID();
    await expect(verifyCredentials({ email: input.email, password }, client)).resolves.toBeNull();
    await expect(verifyCredentials(input, client)).resolves.toMatchObject({ name: "New Reseller" });
  });

  it("bounds concurrent attempts per client and reopens registration after the window", async () => {
    const client = randomUUID();
    const attempts = await Promise.all(
      Array.from({ length: 12 }, () => reserveRegistrationAttempt(client)),
    );
    expect(attempts.filter(Boolean)).toHaveLength(8);
    const input = signupInput();
    await expect(registerUser(input, client)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await testDb.user.findUnique({ where: { email: input.email } })).toBeNull();

    await testDb.authThrottle.update({
      where: { key: createThrottleKey("registration", client) },
      data: { windowStartedAt: new Date(Date.now() - 16 * 60 * 1000) },
    });
    await expect(registerUser(input, client)).resolves.toMatchObject({ email: input.email });
  });
});
