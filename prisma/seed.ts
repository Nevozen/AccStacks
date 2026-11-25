import "dotenv/config";
import { dateToInput } from "../src/lib/dates";
import { createAccount } from "../src/services/accounts";
import { createListing } from "../src/services/listings";
import { confirmSale } from "../src/services/sales";
import { chooseCurrency, getSettings } from "../src/services/settings";
import { db } from "../src/server/db";
import { provisionOwner } from "../src/server/owner";

const DAYS = 24 * 60 * 60 * 1000;

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed data cannot be inserted into production");
  }

  const owner = await provisionOwner({
    name: process.env.SEED_OWNER_NAME ?? "Demo Reseller",
    email: process.env.SEED_OWNER_EMAIL,
    password: process.env.SEED_OWNER_PASSWORD,
  });

  if ((await db.account.count({ where: { ownerId: owner.id } })) > 0) {
    console.log("Seed skipped: this owner already has account records");
    return;
  }
  const { currency } = await getSettings(owner.id);
  if (currency === "USD") throw new Error("The development sample data is denominated in IDR");
  if (currency === null) await chooseCurrency(owner.id, "IDR");

  const now = Date.now();
  const available = await createAccount(owner.id, {
    gameName: "Genshin Impact",
    accountName: "AR 58 — Fontaine Explorer",
    description: "Exploration-ready account with a diverse character roster.",
    imageUrl: "",
    purchasePrice: "750000",
    purchaseDate: dateToInput(new Date(now - 8 * DAYS)),
    purchasedFrom: "Private seller",
    notes: "",
  });

  const listed = await createAccount(owner.id, {
    gameName: "Mobile Legends",
    accountName: "Mythical Glory Account",
    description: "High-rank account with a broad hero and skin collection.",
    imageUrl: "",
    purchasePrice: "500000",
    purchaseDate: dateToInput(new Date(now - 20 * DAYS)),
    purchasedFrom: "Community seller",
    notes: "",
  });
  for (const [index, marketplace] of ["Instagram", "Facebook", "Itemku"].entries()) {
    await createListing(owner.id, {
      accountId: listed.id,
      marketplace,
      listingPrice: String(800_000 + index * 50_000),
      listingUrl: "",
      listedAt: dateToInput(new Date(now - (7 - index) * DAYS)),
      notes: "",
    });
  }

  const sold = await createAccount(owner.id, {
    gameName: "Valorant",
    accountName: "Immortal — Premium Collection",
    description: "Competitive account with documented purchase history.",
    imageUrl: "",
    purchasePrice: "1000000",
    purchaseDate: dateToInput(new Date(now - 45 * DAYS)),
    purchasedFrom: "Trusted reseller",
    notes: "",
  });
  const winningListing = await createListing(owner.id, {
    accountId: sold.id,
    marketplace: "Discord",
    listingPrice: "1500000",
    listingUrl: "",
    listedAt: dateToInput(new Date(now - 14 * DAYS)),
    notes: "",
  });
  await createListing(owner.id, {
    accountId: sold.id,
    marketplace: "Telegram",
    listingPrice: "1550000",
    listingUrl: "",
    listedAt: dateToInput(new Date(now - 13 * DAYS)),
    notes: "",
  });
  await confirmSale(owner.id, {
    listingId: winningListing.id,
    sellingPrice: "1400000",
    soldAt: dateToInput(new Date(now - 2 * DAYS)),
    notes: "Buyer completed payment before account handover.",
    expenses: [
      { name: "Middleman fee", amount: "25000" },
      { name: "Transfer fee", amount: "10000" },
    ],
  });

  console.log(
    `Created development inventory: ${[available, listed, sold].map((account) => `${account.accountCode} — ${account.accountName}`).join(", ")}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
