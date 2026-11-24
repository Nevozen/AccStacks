import { db } from "@/server/db";

export async function searchAccounts(ownerId: string, search: string) {
  const q = search.trim().slice(0, 150);
  if (!q) return [];
  return db.account.findMany({
    where: {
      ownerId,
      deletedAt: null,
      OR: [
        { accountName: { contains: q, mode: "insensitive" } },
        { gameName: { contains: q, mode: "insensitive" } },
        { id: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      accountName: true,
      gameName: true,
      imageUrl: true,
      purchasePrice: true,
      sale: { select: { id: true } },
      _count: { select: { listings: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
}
