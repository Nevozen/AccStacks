import { afterAll, describe, expect, it } from "vitest";
import { createAccount } from "@/services/accounts";
import { cancelListing, createListing } from "@/services/listings";
import { db } from "@/server/db";
import { createTestUser, testDb } from "./client";

function input(gameName: string, accountName = "Code Test") {
  return {
    gameName,
    accountName,
    description: "",
    imageUrl: "",
    purchasePrice: "500000",
    purchaseDate: "2026-11-01",
    purchasedFrom: "",
    notes: "",
  };
}

afterAll(async () => {
  await Promise.all([testDb.$disconnect(), db.$disconnect()]);
});

describe("public code allocation", () => {
  it("sequences accounts, resolves game-prefix collisions, and scopes codes by owner", async () => {
    const firstUser = await createTestUser();
    const secondUser = await createTestUser();
    expect((await createAccount(firstUser.id, input("Wuthering Waves"))).accountCode).toBe("WW1");
    expect((await createAccount(firstUser.id, input("Wuthering Waves"))).accountCode).toBe("WW2");
    expect((await createAccount(firstUser.id, input("Wuthering Wannabe"))).accountCode).toBe(
      "WWA1",
    );
    expect((await createAccount(firstUser.id, input("Where Winds Meet"))).accountCode).toBe("WWM1");
    expect((await createAccount(secondUser.id, input("Wuthering Waves"))).accountCode).toBe("WW1");
  });

  it("reuses the lowest free listing suffix without changing retained listings", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, input("Wuthering Waves"));
    const first = await createListing(user.id, {
      accountId: account.id,
      marketplace: "Instagram",
      listingPrice: "800000",
      listingUrl: "",
      listedAt: "2026-11-02",
      notes: "",
    });
    const second = await createListing(user.id, {
      accountId: account.id,
      marketplace: "Facebook",
      listingPrice: "850000",
      listingUrl: "",
      listedAt: "2026-11-03",
      notes: "",
    });
    expect(first.listingCode).toBe("WW1-1");
    expect(second.listingCode).toBe("WW1-2");
    await cancelListing(user.id, first.id);
    const third = await createListing(user.id, {
      accountId: account.id,
      marketplace: "Itemku",
      listingPrice: "900000",
      listingUrl: "",
      listedAt: "2026-11-04",
      notes: "",
    });
    expect(third.listingCode).toBe("WW1-1");
    expect(third.id).not.toBe(first.id);
    expect(await testDb.listing.findUnique({ where: { id: first.id } })).toMatchObject({
      status: "CANCELLED",
      listingCode: "WW1-1",
    });
    expect(await testDb.listing.findUnique({ where: { id: second.id } })).toMatchObject({
      status: "ACTIVE",
      listingCode: "WW1-2",
    });
  });

  it("resets to suffix one and keeps codes unique during concurrent relisting", async () => {
    const user = await createTestUser();
    const account = await createAccount(user.id, input("Wuthering Waves"));
    const draft = { accountId: account.id, listingPrice: "800000", listedAt: "2026-11-02" };
    const original = await createListing(user.id, { ...draft, marketplace: "Instagram" });
    await cancelListing(user.id, original.id);

    const relisted = await Promise.all(
      ["Facebook", "Itemku"].map((marketplace) =>
        createListing(user.id, { ...draft, marketplace }),
      ),
    );
    expect(relisted.map(({ listingCode }) => listingCode).sort()).toEqual(["WW1-1", "WW1-2"]);
  });

  it("allocates unique account codes during concurrent creation", async () => {
    const user = await createTestUser();
    const accounts = await Promise.all(
      Array.from({ length: 4 }, (_, index) =>
        createAccount(user.id, input("Mobile Legends", `Concurrent ${index}`)),
      ),
    );
    const codes = accounts.map((account) => account.accountCode);
    expect(new Set(codes).size).toBe(4);
    expect(codes.sort()).toEqual(["ML1", "ML2", "ML3", "ML4"]);
  });
});
