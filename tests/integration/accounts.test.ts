import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { archiveAccount, createAccount, getStocksData, updateAccount } from "@/services/accounts";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

function accountInput(name = "Integration Inventory") {
  return {
    gameName: "  Mobile   Legends ",
    accountName: `${name} ${randomUUID()}`,
    description: "Rank and collection details",
    imageUrl: "",
    purchasePrice: "500000",
    purchaseDate: "2026-11-01",
    purchasedFrom: "Test seller",
    notes: "Private note",
  };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("account inventory service", () => {
  it("creates accounts and derives available, listed, and available states", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, accountInput());
    expect(account.gameName).toBe("Mobile Legends");
    expect(account.gameNameNormalized).toBe("mobile legends");
    expect(account.purchasePrice).toBe(500_000n);

    const initial = await getStocksData(user.id, { category: "available" });
    expect(initial.accounts.map((item) => item.id)).toContain(account.id);

    const listing = await testDb.listing.create({
      data: {
        accountId: account.id,
        listingCode: `${account.accountCode}-1`,
        marketplace: "Instagram",
        marketplaceNormalized: "instagram",
        listingPrice: 800_000n,
        listedAt: new Date(),
      },
    });
    const listed = await getStocksData(user.id, { category: "listed" });
    expect(listed.accounts.map((item) => item.id)).toContain(account.id);

    await testDb.listing.update({
      where: { id: listing.id },
      data: { status: "CANCELLED", closedAt: new Date() },
    });
    const available = await getStocksData(user.id, { category: "available" });
    expect(available.accounts.map((item) => item.id)).toContain(account.id);
  });

  it("edits unsold accounts and prevents deletion while listings are active", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, accountInput());
    await updateAccount(user.id, account.id, {
      ...accountInput(),
      accountName: account.accountName,
      purchasePrice: "650000",
    });
    expect(
      (await testDb.account.findUniqueOrThrow({ where: { id: account.id } })).purchasePrice,
    ).toBe(650_000n);

    await testDb.listing.create({
      data: {
        accountId: account.id,
        listingCode: `${account.accountCode}-1`,
        marketplace: "Facebook",
        marketplaceNormalized: "facebook",
        listingPrice: 850_000n,
        listedAt: new Date(),
      },
    });
    await expect(archiveAccount(user.id, account.id)).rejects.toThrow("Cancel all active listings");
  });

  it("archives eligible accounts without hard-deleting their history", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, accountInput());
    await archiveAccount(user.id, account.id);
    expect(
      (await testDb.account.findUniqueOrThrow({ where: { id: account.id } })).deletedAt,
    ).not.toBeNull();
    const stocks = await getStocksData(user.id, {});
    expect(stocks.accounts.map((item) => item.id)).not.toContain(account.id);
  });

  it("keeps sold accounts read-only and preserved", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, accountInput());
    const listing = await testDb.listing.create({
      data: {
        accountId: account.id,
        listingCode: `${account.accountCode}-1`,
        marketplace: "Discord",
        marketplaceNormalized: "discord",
        listingPrice: 800_000n,
        listedAt: new Date(),
        status: "SOLD",
        closedAt: new Date(),
      },
    });
    await testDb.sale.create({
      data: {
        accountId: account.id,
        listingId: listing.id,
        marketplace: "Discord",
        marketplaceNormalized: "discord",
        purchasePrice: 500_000n,
        originalListingPrice: 800_000n,
        sellingPrice: 750_000n,
        totalExpenses: 0n,
        netProfit: 250_000n,
        soldAt: new Date(),
      },
    });

    await expect(updateAccount(user.id, account.id, accountInput())).rejects.toThrow("read-only");
    await expect(archiveAccount(user.id, account.id)).rejects.toThrow("financial history");
  });

  it("enforces ownership and rejects unsafe inputs", async () => {
    const firstUser = await createTestUser();
    const secondUser = await createTestUser();
    const account = await createAccount(firstUser.id, accountInput());

    await expect(updateAccount(secondUser.id, account.id, accountInput())).rejects.toThrow(
      "Account not found",
    );
    await expect(archiveAccount(secondUser.id, account.id)).rejects.toThrow("Account not found");
    await expect(
      createAccount(firstUser.id, { ...accountInput(), purchasePrice: "-1" }),
    ).rejects.toThrow();
    await expect(
      createAccount(firstUser.id, {
        ...accountInput(),
        imageUrl: "http://insecure.example/image.png",
      }),
    ).rejects.toThrow();
  });
});
