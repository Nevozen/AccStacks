import { Prisma } from "@/generated/prisma/client";
import { buildListingCode } from "@/lib/codes";
import { dateInputToUtc } from "@/lib/dates";
import { AppError } from "@/lib/errors";
import { parseMoneyInput } from "@/lib/money";
import { normalizeCategory, normalizeName } from "@/lib/normalization";
import {
  listingInputSchema,
  listingQuerySchema,
  type ListingInput,
  type ListingQuery,
  type UpdateListingInput,
} from "@/schemas/listing";
import { db } from "@/server/db";
import { requireCurrency } from "./settings";

const listingInclude = {
  account: {
    select: {
      id: true,
      accountCode: true,
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
  const currency = await requireCurrency(ownerId);
  const data = listingInputSchema(currency).parse(input);
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Account"
      WHERE id = ${data.accountId} AND "ownerId" = ${ownerId} AND "deletedAt" IS NULL
      FOR UPDATE
    `;
    if (!locked.length) throw new AppError("NOT_FOUND", "Eligible account not found");
    const account = await tx.account.findUniqueOrThrow({
      where: { id: data.accountId },
      include: { sale: { select: { id: true } } },
    });
    if (account.sale) throw new AppError("CONFLICT", "Sold accounts cannot be listed again");
    const retainedListings = await tx.listing.findMany({
      where: { accountId: account.id, status: { not: "CANCELLED" } },
      select: { listingCode: true },
    });
    const used = new Set(retainedListings.map(({ listingCode }) => listingCode));
    let sequence = 1;
    while (used.has(buildListingCode(account.accountCode, sequence))) sequence += 1;

    return tx.listing.create({
      data: {
        accountId: account.id,
        listingCode: buildListingCode(account.accountCode, sequence),
        marketplace: normalizeName(data.marketplace),
        marketplaceNormalized: normalizeCategory(data.marketplace),
        listingPrice: parseMoneyInput(data.listingPrice, currency)!,
        listingUrl: emptyToNull(data.listingUrl),
        listedAt: dateInputToUtc(data.listedAt),
        notes: emptyToNull(data.notes),
      },
    });
  });
}

export async function updateListing(ownerId: string, listingId: string, input: UpdateListingInput) {
  const currency = await requireCurrency(ownerId);
  const data = listingInputSchema(currency).omit({ accountId: true }).parse(input);
  const listing = await db.listing.findFirst({
    where: { id: listingId, status: "ACTIVE", account: { ownerId, deletedAt: null, sale: null } },
  });
  if (!listing) throw new AppError("NOT_FOUND", "Active listing not found");

  return db.listing.update({
    where: { id: listing.id },
    data: {
      marketplace: normalizeName(data.marketplace),
      marketplaceNormalized: normalizeCategory(data.marketplace),
      listingPrice: parseMoneyInput(data.listingPrice, currency)!,
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
      Prisma.sql`(a."accountName" ILIKE ${pattern} OR a."gameName" ILIKE ${pattern} OR a.id ILIKE ${pattern} OR a."accountCode" ILIKE ${pattern} OR l."listingCode" ILIKE ${pattern} OR l.marketplace ILIKE ${pattern})`,
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
  const pageRecords = ids.length
    ? await db.listing.findMany({
        where: { id: { in: ids.map((row) => row.id) } },
        include: listingInclude,
      })
    : [];
  const byId = new Map(pageRecords.map((record) => [record.id, record]));
  const accountIds = [...new Set(pageRecords.map((record) => record.accountId))];
  const records = accountIds.length
    ? await db.listing.findMany({
        where: {
          status: "ACTIVE",
          accountId: { in: accountIds },
          account: { ownerId, deletedAt: null, sale: null },
        },
        include: listingInclude,
        orderBy: { listedAt: "desc" },
      })
    : [];
  const accountOrder = ids
    .map((row) => byId.get(row.id)!.accountId)
    .filter((accountId, index, all) => all.indexOf(accountId) === index);

  return {
    listings: accountOrder.flatMap((accountId) =>
      records.filter((record) => record.accountId === accountId),
    ),
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
        select: {
          id: true,
          listingCode: true,
          marketplace: true,
          marketplaceNormalized: true,
          listingPrice: true,
        },
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
