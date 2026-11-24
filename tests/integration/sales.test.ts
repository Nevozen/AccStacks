import { afterAll, describe, expect, it } from "vitest";
import { createAccount, getStocksData } from "@/services/accounts";
import { createListing, getListingsData } from "@/services/listings";
import { confirmSale } from "@/services/sales";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

async function setupAccount(ownerId: string) {
  const account = await createAccount(ownerId, {
    gameName: "Mobile Legends",
    accountName: "Sale Integration Account",
    description: "",
    imageUrl: "",
    purchasePrice: "500000",
    purchaseDate: "2026-11-01",
    purchasedFrom: "",
    notes: "",
  });
  const first = await createListing(ownerId, {
    accountId: account.id,
    marketplace: "Instagram",
    listingPrice: "850000",
    listingUrl: "",
    listedAt: "2026-11-02",
    notes: "",
  });
  const second = await createListing(ownerId, {
    accountId: account.id,
    marketplace: "Facebook",
    listingPrice: "900000",
    listingUrl: "",
    listedAt: "2026-11-03",
    notes: "",
  });
  return { account, first, second };
}

function saleInput(listingId: string, sellingPrice = "800000") {
  return {
    listingId,
    sellingPrice,
    soldAt: "2026-11-24",
    notes: "Completed test sale",
    expenses: [
      { name: "Marketplace fee", amount: "20000" },
      { name: "Middleman fee", amount: "5000" },
    ],
  };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("atomic sale service", () => {
  it("persists snapshots and expenses and closes every related active listing", async () => {
    const user = await createTestUser();
    const { account, first } = await setupAccount(user.id);
    const sale = await confirmSale(user.id, saleInput(first.id));

    expect(sale).toMatchObject({
      accountId: account.id,
      listingId: first.id,
      purchasePrice: 500_000n,
      originalListingPrice: 850_000n,
      sellingPrice: 800_000n,
      totalExpenses: 25_000n,
      netProfit: 275_000n,
    });
    expect(sale.expenses).toHaveLength(2);
    const listings = await testDb.listing.findMany({ where: { accountId: account.id } });
    expect(listings.find((item) => item.id === first.id)?.status).toBe("SOLD");
    expect(
      listings.filter((item) => item.id !== first.id).every((item) => item.status === "CLOSED"),
    ).toBe(true);
    expect((await getListingsData(user.id, {})).totalActiveListings).toBe(0);
    expect(
      (await getStocksData(user.id, { category: "sold" })).accounts.map((item) => item.id),
    ).toContain(account.id);
  });

  it("allows a valid sale at a financial loss", async () => {
    const user = await createTestUser();
    const { first } = await setupAccount(user.id);
    const sale = await confirmSale(user.id, saleInput(first.id, "400000"));
    expect(sale.netProfit).toBe(-125_000n);
  });

  it("prevents a duplicate sale", async () => {
    const user = await createTestUser();
    const { account, first, second } = await setupAccount(user.id);
    await confirmSale(user.id, saleInput(first.id));
    await expect(confirmSale(user.id, saleInput(second.id))).rejects.toThrow("already been sold");
    expect(await testDb.sale.count({ where: { accountId: account.id } })).toBe(1);
  });

  it("allows only one winner during concurrent sale attempts", async () => {
    const user = await createTestUser();
    const { account, first, second } = await setupAccount(user.id);
    const attempts = await Promise.allSettled([
      confirmSale(user.id, saleInput(first.id, "800000")),
      confirmSale(user.id, saleInput(second.id, "825000")),
    ]);

    expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
    expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
    expect(await testDb.sale.count({ where: { accountId: account.id } })).toBe(1);
    expect(await testDb.saleExpense.count({ where: { sale: { accountId: account.id } } })).toBe(2);
    expect(await testDb.listing.count({ where: { accountId: account.id, status: "ACTIVE" } })).toBe(
      0,
    );
  });

  it("leaves inventory and listings unchanged when sale calculation fails", async () => {
    const user = await createTestUser();
    const { account, first } = await setupAccount(user.id);
    await expect(
      confirmSale(user.id, {
        ...saleInput(first.id, "9007199254740991"),
        expenses: [
          { name: "First large fee", amount: "9007199254740991" },
          { name: "Second large fee", amount: "9007199254740991" },
        ],
      }),
    ).rejects.toThrow();

    expect(await testDb.sale.count({ where: { accountId: account.id } })).toBe(0);
    expect(await testDb.listing.count({ where: { accountId: account.id, status: "ACTIVE" } })).toBe(
      2,
    );
  });

  it("enforces ownership without modifying another user's listing", async () => {
    const owner = await createTestUser();
    const otherUser = await createTestUser();
    const { account, first } = await setupAccount(owner.id);
    await expect(confirmSale(otherUser.id, saleInput(first.id))).rejects.toThrow("not found");
    expect(await testDb.sale.count({ where: { accountId: account.id } })).toBe(0);
    expect((await testDb.listing.findUniqueOrThrow({ where: { id: first.id } })).status).toBe(
      "ACTIVE",
    );
  });
});
