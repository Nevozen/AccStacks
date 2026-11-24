import { afterAll, describe, expect, it } from "vitest";
import { getStocksData } from "@/services/accounts";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("stock status and name ordering", () => {
  it("orders Available alphabetically, then Listed, then Sold", async () => {
    const user = await createTestUser();
    for (const [index, name] of [
      "Omega Sold",
      "Beta Listed",
      "Zed Available",
      "Alpha Available",
    ].entries()) {
      const accountCode = `ML${index + 1}`;
      const sold = name === "Omega Sold";
      const listed = sold || name === "Beta Listed";
      const account = await testDb.account.create({
        data: {
          ownerId: user.id,
          accountCode,
          gameName: "Mobile Legends",
          gameNameNormalized: "mobile legends",
          accountName: name,
          purchasePrice: 500_000n,
          purchaseDate: new Date("2026-11-01T00:00:00.000Z"),
        },
      });
      if (listed) {
        const listing = await testDb.listing.create({
          data: {
            accountId: account.id,
            listingCode: `${accountCode}-1`,
            marketplace: "Instagram",
            marketplaceNormalized: "instagram",
            listingPrice: 800_000n,
            listedAt: new Date("2026-11-02T00:00:00.000Z"),
            status: sold ? "SOLD" : "ACTIVE",
            closedAt: sold ? new Date("2026-11-03T00:00:00.000Z") : null,
          },
        });
        if (sold) {
          await testDb.sale.create({
            data: {
              accountId: account.id,
              listingId: listing.id,
              marketplace: "Instagram",
              marketplaceNormalized: "instagram",
              purchasePrice: 500_000n,
              originalListingPrice: 800_000n,
              sellingPrice: 800_000n,
              totalExpenses: 0n,
              netProfit: 300_000n,
              soldAt: new Date("2026-11-03T00:00:00.000Z"),
            },
          });
        }
      }
    }

    const result = await getStocksData(user.id, {});
    expect(result.accounts.map((account) => account.accountName)).toEqual([
      "Alpha Available",
      "Zed Available",
      "Beta Listed",
      "Omega Sold",
    ]);
  });
});
