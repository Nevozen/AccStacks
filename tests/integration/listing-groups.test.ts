import { afterAll, describe, expect, it } from "vitest";
import { createAccount } from "@/services/accounts";
import { getListingsData } from "@/services/listings";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("grouped listing queries", () => {
  it("loads every active listing for an account even when its page contains one listing", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, {
      gameName: "Wuthering Waves",
      accountName: "Thirteen Listings",
      description: "",
      imageUrl: "",
      purchasePrice: "500000",
      purchaseDate: "2026-11-01",
      purchasedFrom: "",
      notes: "",
    });
    await testDb.listing.createMany({
      data: Array.from({ length: 13 }, (_, index) => ({
        accountId: account.id,
        listingCode: `${account.accountCode}-${index + 1}`,
        marketplace: `Marketplace ${index + 1}`,
        marketplaceNormalized: `marketplace-${index + 1}`,
        listingPrice: 800_000n,
        listedAt: new Date(Date.UTC(2026, 10, index + 1)),
      })),
    });

    const result = await getListingsData(user.id, { page: 2 });
    expect(result.totalFiltered).toBe(13);
    expect(result.page).toBe(2);
    expect(result.listings).toHaveLength(13);
    expect(new Set(result.listings.map((listing) => listing.accountId))).toEqual(
      new Set([account.id]),
    );
  });
});
