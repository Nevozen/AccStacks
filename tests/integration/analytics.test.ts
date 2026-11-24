import { DateTime } from "luxon";
import { afterAll, describe, expect, it } from "vitest";
import { createAccount } from "@/services/accounts";
import { getAnalytics } from "@/services/analytics";
import { createListing } from "@/services/listings";
import { confirmSale } from "@/services/sales";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

const now = DateTime.fromISO("2026-11-24T12:00:00", { zone: "Asia/Jakarta" });

async function createStock(ownerId: string, name: string, price: string) {
  return createAccount(ownerId, {
    gameName: "Mobile Legends",
    accountName: name,
    description: "",
    imageUrl: "",
    purchasePrice: price,
    purchaseDate: "2026-11-01",
    purchasedFrom: "",
    notes: "",
  });
}

async function createAnalyticsFixture(ownerId: string) {
  await createStock(ownerId, "Available account", "100000");
  const listed = await createStock(ownerId, "Multiply listed account", "200000");
  for (const [marketplace, price] of [
    ["Instagram", "300000"],
    ["Facebook", "350000"],
  ] as const) {
    await createListing(ownerId, {
      accountId: listed.id,
      marketplace,
      listingPrice: price,
      listingUrl: "",
      listedAt: "2026-11-02",
      notes: "",
    });
  }
  const sold = await createStock(ownerId, "Sold account", "500000");
  const winning = await createListing(ownerId, {
    accountId: sold.id,
    marketplace: "Itemku",
    listingPrice: "850000",
    listingUrl: "",
    listedAt: "2026-11-03",
    notes: "",
  });
  await createListing(ownerId, {
    accountId: sold.id,
    marketplace: "Discord",
    listingPrice: "900000",
    listingUrl: "",
    listedAt: "2026-11-03",
    notes: "",
  });
  await confirmSale(ownerId, {
    listingId: winning.id,
    sellingPrice: "800000",
    soldAt: "2026-11-24",
    notes: "",
    expenses: [{ name: "Marketplace fee", amount: "25000" }],
  });
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("business analytics", () => {
  it("calculates current inventory and realized financials without double-counting listings", async () => {
    const user = await createTestUser();
    await createAnalyticsFixture(user.id);
    const result = await getAnalytics(
      user.id,
      { range: "custom", from: "2026-11-01", to: "2026-11-30" },
      "Asia/Jakarta",
      now,
    );

    expect(result.inventory).toMatchObject({
      totalAccounts: 3,
      availableAccounts: 1,
      listedAccounts: 1,
      soldAccounts: 1,
      activeListings: 2,
      inventoryValue: 300_000n,
      estimatedUnrealizedProfit: 150_000n,
    });
    expect(result.financial).toMatchObject({
      completedSales: 1,
      totalRevenue: 800_000n,
      costOfGoodsSold: 500_000n,
      totalAdditionalExpenses: 25_000n,
      netProfit: 275_000n,
      profitMargin: "34.38",
      returnOnInvestment: "55.00",
      averageProfitPerSale: 275_000n,
      averageSellingPrice: 800_000n,
    });
    expect(result.trends).toHaveLength(1);
    expect(result.monthlySales[0]).toMatchObject({ period: "2026-11", sales: 1n });
    expect(result.gamePerformance[0]).toMatchObject({
      name: "Mobile Legends",
      netProfit: 275_000n,
    });
    expect(result.marketplacePerformance[0]).toMatchObject({ name: "Itemku", revenue: 800_000n });
    expect(result.recentSales).toHaveLength(1);
  });

  it("applies reporting periods only to sales and isolates owners", async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    await createAnalyticsFixture(owner.id);
    const outsidePeriod = await getAnalytics(
      owner.id,
      { range: "custom", from: "2026-10-01", to: "2026-10-31" },
      "Asia/Jakarta",
      now,
    );
    expect(outsidePeriod.financial.completedSales).toBe(0);
    expect(outsidePeriod.inventory.totalAccounts).toBe(3);
    expect(outsidePeriod.recentSales).toHaveLength(0);

    const isolated = await getAnalytics(otherUser.id, { range: "all" }, "Asia/Jakarta", now);
    expect(isolated.inventory.totalAccounts).toBe(0);
    expect(isolated.financial.completedSales).toBe(0);
    expect(isolated.financial.totalRevenue).toBe(0n);
  });
});
