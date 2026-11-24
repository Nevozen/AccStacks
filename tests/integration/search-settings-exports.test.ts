import { afterAll, describe, expect, it } from "vitest";
import { createAccount } from "@/services/accounts";
import {
  getActiveListingsExport,
  getCompletedSalesExport,
  getInventoryExport,
} from "@/services/exports";
import { createListing } from "@/services/listings";
import { searchAccounts } from "@/services/search";
import { confirmSale } from "@/services/sales";
import { getSettings, updateSettings } from "@/services/settings";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

async function createOwnedAccount(ownerId: string, accountName: string) {
  return createAccount(ownerId, {
    gameName: "Genshin Impact",
    accountName,
    description: "=not-a-formula-in-the-database",
    imageUrl: "",
    purchasePrice: "500000",
    purchaseDate: "2026-11-01",
    purchasedFrom: "Test seller",
    notes: "",
  });
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("settings, search, and exports", () => {
  it("persists valid preferences and rejects an invalid timezone", async () => {
    const user = await createTestUser();
    expect((await getSettings(user.id)).timezone).toBe("Asia/Jakarta");
    expect((await getSettings(user.id)).theme).toBe("LIGHT");
    const updated = await updateSettings(user.id, {
      theme: "DARK",
      timezone: "UTC",
      currency: "IDR",
      preferredStockView: "TABLE",
    });
    expect(updated).toMatchObject({ theme: "DARK", timezone: "UTC", preferredStockView: "TABLE" });
    await expect(
      updateSettings(user.id, {
        theme: "LIGHT",
        timezone: "Invalid/Zone",
        currency: "IDR",
        preferredStockView: "GRID",
      }),
    ).rejects.toThrow();
  });

  it("searches only the authenticated owner's matching accounts", async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const account = await createOwnedAccount(owner.id, "Unique Searchable Account");
    await createOwnedAccount(otherUser.id, "Unique Searchable Account");

    const byName = await searchAccounts(owner.id, "Unique Searchable");
    expect(byName).toHaveLength(1);
    expect(byName[0]?.id).toBe(account.id);
    expect((await searchAccounts(owner.id, account.id))[0]?.id).toBe(account.id);
    expect(await searchAccounts(owner.id, "")).toHaveLength(0);
  });

  it("scopes every export dataset to its owner", async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const account = await createOwnedAccount(owner.id, "Export Account");
    const listing = await createListing(owner.id, {
      accountId: account.id,
      marketplace: "Instagram",
      listingPrice: "800000",
      listingUrl: "",
      listedAt: "2026-11-02",
      notes: "",
    });
    await confirmSale(owner.id, {
      listingId: listing.id,
      sellingPrice: "750000",
      soldAt: "2026-11-24",
      notes: "",
      expenses: [],
    });

    expect(await getInventoryExport(owner.id)).toHaveLength(1);
    expect(await getActiveListingsExport(owner.id)).toHaveLength(0);
    expect(await getCompletedSalesExport(owner.id)).toHaveLength(1);
    expect(await getInventoryExport(otherUser.id)).toHaveLength(0);
    expect(await getCompletedSalesExport(otherUser.id)).toHaveLength(0);
  });
});
