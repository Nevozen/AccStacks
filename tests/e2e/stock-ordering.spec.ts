import { expect, test } from "@playwright/test";
import { testDb } from "../integration/client";
import { createE2eOwner, signIn } from "./helpers";

test.afterAll(() => testDb.$disconnect());

test("stocks display Available, Listed, then Sold with alphabetical names", async ({ page }) => {
  const owner = await createE2eOwner();
  for (const [index, name] of [
    "Omega Sold",
    "Beta Listed",
    "Zed Available",
    "Alpha Available",
  ].entries()) {
    const accountCode = `ML-E2E-ORDER-${index + 1}`;
    const sold = name === "Omega Sold";
    const listed = sold || name === "Beta Listed";
    const account = await testDb.account.create({
      data: {
        ownerId: owner.user.id,
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

  await signIn(page, owner);
  await page.goto("/stocks");
  await expect(page.getByTestId("account-card")).toHaveCount(4);
  await expect(page.getByTestId("account-card").locator("h2").allTextContents()).resolves.toEqual([
    "Alpha Available",
    "Zed Available",
    "Beta Listed",
    "Omega Sold",
  ]);
});
