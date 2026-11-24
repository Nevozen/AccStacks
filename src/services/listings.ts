import { Prisma } from "@/generated/prisma/client";
import { dateInputToUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { normalizeCategory, normalizeName } from "@/lib/normalization";
import {
  listingInputSchema,
  listingQuerySchema,
  updateListingInputSchema,
  type ListingInput,
  type ListingQuery,
  type UpdateListingInput,
} from "@/schemas/listing";
import { db } from "@/server/db";

const listingInclude = {
  account: {
    select: {
      id: true,
      gameName: true,
      accountName: true,
      description: true,
      imageUrl: true,
      purchasePrice: true,
      purchaseDate: true,
      _count: { select: { listings: { where: { status: "ACTIVE" as const } } } },
    },
  },
} satisfies Prisma.ListingInclude;

export type ListingRecord = Prisma.ListingGetPayload<{ include: typeof listingInclude }>;

function emptyToNull(value?: string) {
  return value?.trim() ? value.trim() : null;
}

export async function createListing(ownerId: string, input: ListingInput) {
  const data = listingInputSchema.parse(input);
  return db.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: data.accountId, ownerId, deletedAt: null },
      include: { sale: { select: { id: true } } },
    });
    if (!account) throw new AppError("NOT_FOUND", "Eligible account not found");
    if (account.sale) throw new AppError("CONFLICT", "Sold accounts cannot be listed again");

    return tx.listing.create({
      data: {
        accountId: account.id,
        marketplace: normalizeName(data.marketplace),
        marketplaceNormalized: normalizeCategory(data.marketplace),
        listingPrice: BigInt(data.listingPrice),
        listingUrl: emptyToNull(data.listingUrl),
        listedAt: dateInputToUtc(data.listedAt),
        notes: emptyToNull(data.notes),
      },
    });
  });
}

export async function updateListing(ownerId: string, listingId: string, input: UpdateListingInput) {
  const data = updateListingInputSchema.parse(input);
  const listing = await db.listing.findFirst({
    where: { id: listingId, status: "ACTIVE", account: { ownerId, deletedAt: null, sale: null } },
  });
  if (!listing) throw new AppError("NOT_FOUND", "Active listing not found");

  return db.listing.update({
    where: { id: listing.id },
    data: {
      marketplace: normalizeName(data.marketplace),
      marketplaceNormalized: normalizeCategory(data.marketplace),
      listingPrice: BigInt(data.listingPrice),
      listingUrl: emptyToNull(data.listingUrl),
      listedAt: dateInputToUtc(data.listedAt),
      notes: emptyToNull(data.notes),
    },
  });
}

export async function cancelListing(ownerId: string, listingId: string) {
  const result = await db.listing.updateMany({
    where: { id: listingId, status: "ACTIVE", account: { ownerId, deletedAt: null, sale: null } },
    data: { status: "CANCELLED", closedAt: new Date() },
  });
  if (result.count === 0) throw new AppError("NOT_FOUND", "Active listing not found");
}

function listingOrder(
  sort: "newest" | "oldest" | "priceHigh" | "priceLow" | "profitHigh" | "profitLow" | "marketplace",
) {
  switch (sort) {
    case "oldest":
      return Prisma.sql`l."listedAt" ASC, l.id ASC`;
    case "priceHigh":
      return Prisma.sql`l."listingPrice" DESC, l."listedAt" DESC`;
    case "priceLow":
      return Prisma.sql`l."listingPrice" ASC, l."listedAt" DESC`;
    case "profitHigh":
      return Prisma.sql`(l."listingPrice" - a."purchasePrice") DESC, l."listedAt" DESC`;
    case "profitLow":
      return Prisma.sql`(l."listingPrice" - a."purchasePrice") ASC, l."listedAt" DESC`;
    case "marketplace":
      return Prisma.sql`l."marketplaceNormalized" ASC, l."listedAt" DESC`;
    default:
      return Prisma.sql`l."listedAt" DESC, l.id DESC`;
  }
}

export async function getListingsData(ownerId: string, query: ListingQuery) {
  const { q, game, marketplace, sort, page } = listingQuerySchema.parse(query);
  const filters = [
    Prisma.sql`a."ownerId" = ${ownerId}`,
    Prisma.sql`a."deletedAt" IS NULL`,
    Prisma.sql`l.status = 'ACTIVE'`,
    Prisma.sql`NOT EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id)`,
  ];
  if (q) {
    const pattern = `%${q}%`;
    filters.push(
      Prisma.sql`(a."accountName" ILIKE ${pattern} OR a."gameName" ILIKE ${pattern} OR a.id ILIKE ${pattern} OR l.marketplace ILIKE ${pattern})`,
    );
  }
  if (game) filters.push(Prisma.sql`a."gameNameNormalized" = ${normalizeCategory(game)}`);
  if (marketplace)
    filters.push(Prisma.sql`l."marketplaceNormalized" = ${normalizeCategory(marketplace)}`);
  const where = Prisma.join(filters, " AND ");
  const from = Prisma.sql`FROM "Listing" l JOIN "Account" a ON a.id = l."accountId" WHERE ${where}`;
  const pageSize = 12;
  const activeWhere: Prisma.ListingWhereInput = {
    status: "ACTIVE",
    account: { ownerId, deletedAt: null, sale: null },
  };
  const [countRows, totalActiveListings, uniqueAccounts] = await Promise.all([
    db.$queryRaw<{ count: bigint }[]>(Prisma.sql`SELECT COUNT(*)::bigint AS count ${from}`),
    db.listing.count({ where: activeWhere }),
    db.listing.findMany({
      where: activeWhere,
      select: { accountId: true },
      distinct: ["accountId"],
    }),
  ]);
  const totalFiltered = Number(countRows[0]?.count ?? 0n);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const ids = await db.$queryRaw<{ id: string }[]>(
    Prisma.sql`SELECT l.id ${from} ORDER BY ${listingOrder(sort)} LIMIT ${pageSize} OFFSET ${(currentPage - 1) * pageSize}`,
  );
  const records = ids.length
    ? await db.listing.findMany({
        where: { id: { in: ids.map((row) => row.id) } },
        include: listingInclude,
      })
    : [];
  const byId = new Map(records.map((record) => [record.id, record]));

  return {
    listings: ids.map((row) => byId.get(row.id)!),
    totalActiveListings,
    uniqueListedAccounts: uniqueAccounts.length,
    totalFiltered,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function getEligibleAccounts(ownerId: string, search = "") {
  const q = search.trim().slice(0, 150);
  return db.account.findMany({
    where: {
      ownerId,
      deletedAt: null,
      sale: null,
      ...(q
        ? {
            OR: [
              { accountName: { contains: q, mode: "insensitive" } },
              { gameName: { contains: q, mode: "insensitive" } },
              { id: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: {
      listings: {
        where: { status: "ACTIVE" },
        select: { id: true, marketplace: true, marketplaceNormalized: true, listingPrice: true },
        orderBy: { listedAt: "desc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 30,
  });
}

export async function getMarketplaces(ownerId: string) {
  const records = await db.listing.findMany({
    where: { account: { ownerId } },
    select: { marketplace: true, marketplaceNormalized: true },
    distinct: ["marketplaceNormalized"],
    orderBy: { marketplace: "asc" },
  });
  return records.map((record) => record.marketplace);
}
