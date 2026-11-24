import { afterAll, describe, expect, it } from "vitest";
import { createTestUser, testDb } from "./client";

async function createAccount(ownerId: string, purchasePrice = 500_000n) {
  return testDb.account.create({
    data: {
      ownerId,
      gameName: "Mobile Legends",
      gameNameNormalized: "mobile legends",
      accountName: "Integrity Test Account",
      purchasePrice,
      purchaseDate: new Date("2026-11-01T00:00:00.000Z"),
    },
  });
}

async function createListing(accountId: string) {
  return testDb.listing.create({
    data: {
      accountId,
      marketplace: "Instagram",
      marketplaceNormalized: "instagram",
      listingPrice: 800_000n,
      listedAt: new Date("2026-11-02T00:00:00.000Z"),
    },
  });
}

afterAll(() => testDb.$disconnect());

describe("database financial integrity", () => {
  it("enforces unique completed sales per account and listing", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id);
    const listing = await createListing(account.id);
    const data = {
      accountId: account.id,
      listingId: listing.id,
      marketplace: "Instagram",
      marketplaceNormalized: "instagram",
      purchasePrice: 500_000n,
      originalListingPrice: 800_000n,
      sellingPrice: 750_000n,
      totalExpenses: 25_000n,
      netProfit: 225_000n,
      soldAt: new Date("2026-11-03T00:00:00.000Z"),
    };
    await testDb.sale.create({ data });

    await expect(testDb.sale.create({ data })).rejects.toThrow();
    await expect(testDb.sale.count({ where: { accountId: account.id } })).resolves.toBe(1);
  });

  it("rejects a sale whose listing belongs to another account", async () => {
    const user = await createTestUser();
    const firstAccount = await createAccount(user.id);
    const secondAccount = await createAccount(user.id);
    const listing = await createListing(firstAccount.id);

    await expect(
      testDb.sale.create({
        data: {
          accountId: secondAccount.id,
          listingId: listing.id,
          marketplace: "Instagram",
          marketplaceNormalized: "instagram",
          purchasePrice: 500_000n,
          originalListingPrice: 800_000n,
          sellingPrice: 800_000n,
          totalExpenses: 0n,
          netProfit: 300_000n,
          soldAt: new Date(),
        },
      }),
    ).rejects.toThrow();
  });

  it("rejects negative prices and inconsistent saved net profit", async () => {
    const user = await createTestUser();
    await expect(createAccount(user.id, -1n)).rejects.toThrow();
    const account = await createAccount(user.id);
    const listing = await createListing(account.id);

    await expect(
      testDb.sale.create({
        data: {
          accountId: account.id,
          listingId: listing.id,
          marketplace: "Instagram",
          marketplaceNormalized: "instagram",
          purchasePrice: 500_000n,
          originalListingPrice: 800_000n,
          sellingPrice: 800_000n,
          totalExpenses: 0n,
          netProfit: 1n,
          soldAt: new Date(),
        },
      }),
    ).rejects.toThrow();
  });
});
