import { afterAll, describe, expect, it } from "vitest";
import { createAccount, getStocksData } from "@/services/accounts";
import {
  cancelListing,
  createListing,
  getEligibleAccounts,
  getListingsData,
  updateListing,
} from "@/services/listings";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

async function createStock(ownerId: string, purchasePrice = "500000") {
  return createAccount(ownerId, {
    gameName: "Mobile Legends",
    accountName: "Listing Integration Account",
    description: "",
    imageUrl: "",
    purchasePrice,
    purchaseDate: "2026-11-01",
    purchasedFrom: "",
    notes: "",
  });
}

function listingInput(accountId: string, marketplace = "Instagram", listingPrice = "800000") {
  return {
    accountId,
    marketplace,
    listingPrice,
    listingUrl: "",
    listedAt: "2026-11-02",
    notes: "",
  };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("marketplace listing service", () => {
  it("supports independent simultaneous listings and marketplace normalization", async () => {
    const user = await createTestUser();
    const account = await createStock(user.id);
    const instagram = await createListing(user.id, listingInput(account.id, "  InStAgRam   Shop "));
    const facebook = await createListing(user.id, listingInput(account.id, "Facebook", "850000"));

    await updateListing(user.id, instagram.id, {
      marketplace: "Instagram Shop",
      listingPrice: "900000",
      listingUrl: "https://example.com/listing",
      listedAt: "2026-11-02",
      notes: "Updated only this listing",
    });
    expect(instagram.marketplaceNormalized).toBe("instagram shop");
    expect(
      (await testDb.listing.findUniqueOrThrow({ where: { id: instagram.id } })).listingPrice,
    ).toBe(900_000n);
    expect(
      (await testDb.listing.findUniqueOrThrow({ where: { id: facebook.id } })).listingPrice,
    ).toBe(850_000n);
    expect((await getStocksData(user.id, { category: "listed" })).counts.listed).toBe(1);
  });

  it("returns an account to available only after its last active listing is cancelled", async () => {
    const user = await createTestUser();
    const account = await createStock(user.id);
    const first = await createListing(user.id, listingInput(account.id));
    const second = await createListing(user.id, listingInput(account.id, "Facebook"));

    await cancelListing(user.id, first.id);
    expect(
      (await getStocksData(user.id, { category: "listed" })).accounts.map((item) => item.id),
    ).toContain(account.id);
    await cancelListing(user.id, second.id);
    expect(
      (await getStocksData(user.id, { category: "available" })).accounts.map((item) => item.id),
    ).toContain(account.id);
    expect(
      (await testDb.account.findUniqueOrThrow({ where: { id: account.id } })).deletedAt,
    ).toBeNull();
  });

  it("sorts and filters listings using server-side estimated profit", async () => {
    const user = await createTestUser();
    const lowProfit = await createStock(user.id, "700000");
    const highProfit = await createStock(user.id, "100000");
    await createListing(user.id, listingInput(lowProfit.id, "Instagram", "800000"));
    await createListing(user.id, listingInput(highProfit.id, "Facebook", "800000"));

    const result = await getListingsData(user.id, { sort: "profitHigh" });
    expect(result.listings[0]?.accountId).toBe(highProfit.id);
    const filtered = await getListingsData(user.id, { marketplace: "facebook" });
    expect(filtered.listings).toHaveLength(1);
    expect(filtered.listings[0]?.accountId).toBe(highProfit.id);
  });

  it("excludes sold accounts from eligible stocks and rejects new listings", async () => {
    const user = await createTestUser();
    const account = await createStock(user.id);
    const listing = await createListing(user.id, listingInput(account.id));
    await testDb.listing.update({
      where: { id: listing.id },
      data: { status: "SOLD", closedAt: new Date() },
    });
    await testDb.sale.create({
      data: {
        accountId: account.id,
        listingId: listing.id,
        marketplace: "Instagram",
        marketplaceNormalized: "instagram",
        purchasePrice: 500_000n,
        originalListingPrice: 800_000n,
        sellingPrice: 750_000n,
        totalExpenses: 0n,
        netProfit: 250_000n,
        soldAt: new Date(),
      },
    });

    expect((await getEligibleAccounts(user.id)).map((item) => item.id)).not.toContain(account.id);
    await expect(createListing(user.id, listingInput(account.id, "Telegram"))).rejects.toThrow(
      "Sold accounts",
    );
  });

  it("enforces ownership and validates prices and external URLs", async () => {
    const firstUser = await createTestUser();
    const secondUser = await createTestUser();
    const account = await createStock(firstUser.id);
    const listing = await createListing(firstUser.id, listingInput(account.id));

    await expect(cancelListing(secondUser.id, listing.id)).rejects.toThrow(
      "Active listing not found",
    );
    await expect(
      createListing(firstUser.id, listingInput(account.id, "Discord", "-1")),
    ).rejects.toThrow();
    await expect(
      createListing(firstUser.id, {
        ...listingInput(account.id),
        listingUrl: "javascript:alert(1)",
      }),
    ).rejects.toThrow();
  });
});
