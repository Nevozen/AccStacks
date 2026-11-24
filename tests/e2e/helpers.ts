import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { expect, type Page } from "@playwright/test";
import { testDb } from "../integration/client";

export async function createE2eOwner(options?: { capital?: bigint | null }) {
  const suffix = randomUUID();
  const email = `e2e-${suffix}@example.invalid`;
  const password = `e2e-password-${suffix}`;
  const user = await testDb.user.create({
    data: {
      name: "E2E Owner",
      email,
      passwordHash: await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
      }),
      settings: {
        create: { capital: options?.capital === undefined ? 1_000_000n : options.capital },
      },
    },
  });
  return { user, email, password };
}

export async function signIn(page: Page, credentials: { email: string; password: string }) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(credentials.email);
  await page.getByLabel("Password").fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/overview/, { timeout: 60_000 });
}

export async function createAccountAndListingFixture(ownerId: string) {
  const suffix = randomUUID().slice(0, 8);
  const accountCode = `ML-E2E-${suffix.toUpperCase()}`;
  return testDb.account.create({
    data: {
      ownerId,
      accountCode,
      gameName: "Mobile Legends",
      gameNameNormalized: "mobile legends",
      accountName: `Loss Sale ${suffix}`,
      purchasePrice: 500_000n,
      purchaseDate: new Date("2026-11-01T00:00:00.000Z"),
      listings: {
        create: {
          listingCode: `${accountCode}-1`,
          marketplace: "Instagram",
          marketplaceNormalized: "instagram",
          listingPrice: 800_000n,
          listedAt: new Date("2026-11-02T00:00:00.000Z"),
        },
      },
    },
    include: { listings: true },
  });
}
