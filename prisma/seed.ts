import "dotenv/config";
import { calculateSaleMetrics } from "../src/lib/finance";
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

  const now = Date.now();
  const available = await db.account.create({
    data: {
      ownerId: owner.id,
      gameName: "Genshin Impact",
      gameNameNormalized: "genshin impact",
      accountName: "AR 58 — Fontaine Explorer",
      description: "Exploration-ready account with a diverse character roster.",
      purchasePrice: 750_000n,
      purchaseDate: new Date(now - 8 * DAYS),
      purchasedFrom: "Private seller",
    },
  });

  const listed = await db.account.create({
    data: {
      ownerId: owner.id,
      gameName: "Mobile Legends",
      gameNameNormalized: "mobile legends",
      accountName: "Mythical Glory Account",
      description: "High-rank account with a broad hero and skin collection.",
      purchasePrice: 500_000n,
      purchaseDate: new Date(now - 20 * DAYS),
      purchasedFrom: "Community seller",
      listings: {
        create: [
          {
            marketplace: "Instagram",
            marketplaceNormalized: "instagram",
            listingPrice: 800_000n,
            listedAt: new Date(now - 7 * DAYS),
          },
          {
            marketplace: "Facebook",
            marketplaceNormalized: "facebook",
            listingPrice: 850_000n,
            listedAt: new Date(now - 6 * DAYS),
          },
          {
            marketplace: "Itemku",
            marketplaceNormalized: "itemku",
            listingPrice: 900_000n,
            listedAt: new Date(now - 5 * DAYS),
          },
        ],
      },
    },
  });

  const sold = await db.account.create({
    data: {
      ownerId: owner.id,
      gameName: "Valorant",
      gameNameNormalized: "valorant",
      accountName: "Immortal — Premium Collection",
      description: "Competitive account with documented purchase history.",
      purchasePrice: 1_000_000n,
      purchaseDate: new Date(now - 45 * DAYS),
      purchasedFrom: "Trusted reseller",
      listings: {
        create: [
          {
            marketplace: "Discord",
            marketplaceNormalized: "discord",
            listingPrice: 1_500_000n,
            listedAt: new Date(now - 14 * DAYS),
            status: "SOLD",
            closedAt: new Date(now - 2 * DAYS),
          },
          {
            marketplace: "Telegram",
            marketplaceNormalized: "telegram",
            listingPrice: 1_550_000n,
            listedAt: new Date(now - 13 * DAYS),
            status: "CLOSED",
            closedAt: new Date(now - 2 * DAYS),
          },
        ],
      },
    },
    include: { listings: true },
  });
  const winningListing = sold.listings.find((listing) => listing.status === "SOLD")!;
  const metrics = calculateSaleMetrics({
    purchasePrice: sold.purchasePrice,
    sellingPrice: 1_400_000n,
    expenses: [25_000n, 10_000n],
  });
  await db.sale.create({
    data: {
      accountId: sold.id,
      listingId: winningListing.id,
      marketplace: winningListing.marketplace,
      marketplaceNormalized: winningListing.marketplaceNormalized,
      purchasePrice: sold.purchasePrice,
      originalListingPrice: winningListing.listingPrice,
      sellingPrice: 1_400_000n,
      totalExpenses: metrics.totalExpenses,
      netProfit: metrics.netProfit,
      soldAt: new Date(now - 2 * DAYS),
      notes: "Buyer completed payment before account handover.",
      expenses: {
        create: [
          { name: "Middleman fee", amount: 25_000n },
          { name: "Transfer fee", amount: 10_000n },
        ],
      },
    },
  });

  console.log(
    `Created development inventory: ${[available, listed, sold].map((account) => account.accountName).join(", ")}`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
