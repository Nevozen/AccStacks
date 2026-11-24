import { db } from "@/server/db";

export async function getInventoryExport(ownerId: string) {
  return db.account.findMany({
    where: { ownerId, deletedAt: null },
    include: {
      sale: { select: { soldAt: true } },
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { purchaseDate: "desc" },
  });
}

export async function getActiveListingsExport(ownerId: string) {
  return db.listing.findMany({
    where: { status: "ACTIVE", account: { ownerId, deletedAt: null, sale: null } },
    include: { account: true },
    orderBy: { listedAt: "desc" },
  });
}

export async function getCompletedSalesExport(ownerId: string) {
  return db.sale.findMany({
    where: { account: { ownerId } },
    include: {
      account: { select: { accountCode: true, accountName: true, gameName: true } },
      expenses: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { soldAt: "desc" },
  });
}
