import { Prisma } from "@/generated/prisma/client";
import { buildAccountCode, gamePrefix } from "@/lib/codes";
import { removeStoredImage } from "./images";
import {
  accountInputSchema,
  stockQuerySchema,
  type AccountInput,
  type StockQuery,
} from "@/schemas/account";
import { AppError } from "@/lib/errors";
import { dateInputToUtc } from "@/lib/dates";
import { normalizeCategory, normalizeName } from "@/lib/normalization";
import { db } from "@/server/db";

const stockAccountInclude = {
  sale: { select: { id: true, netProfit: true, soldAt: true } },
  _count: { select: { listings: { where: { status: "ACTIVE" as const } } } },
} satisfies Prisma.AccountInclude;

export type StockAccountRecord = Prisma.AccountGetPayload<{ include: typeof stockAccountInclude }>;

const accountDetailInclude = {
  listings: { orderBy: { listedAt: "desc" as const } },
  sale: { include: { expenses: { orderBy: { createdAt: "asc" as const } }, listing: true } },
  _count: { select: { listings: { where: { status: "ACTIVE" as const } } } },
} satisfies Prisma.AccountInclude;

function emptyToNull(value?: string) {
  return value?.trim() ? value.trim() : null;
}

function categoryWhere(
  category: "all" | "available" | "listed" | "sold",
): Prisma.AccountWhereInput {
  if (category === "available") return { sale: null, listings: { none: { status: "ACTIVE" } } };
  if (category === "listed") return { sale: null, listings: { some: { status: "ACTIVE" } } };
  if (category === "sold") return { sale: { isNot: null } };
  return {};
}

export async function createAccount(ownerId: string, input: AccountInput) {
  const data = accountInputSchema.parse(input);
  const gameName = normalizeName(data.gameName);
  const gameNameNormalized = normalizeCategory(data.gameName);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      return await db.$transaction(
        async (tx) => {
          const counters = await tx.gameCounter.findMany({ where: { ownerId } });
          const existing = counters.find(
            (counter) => counter.gameNameNormalized === gameNameNormalized,
          );
          let prefix: string;
          let sequence: number;

          if (existing) {
            const updated = await tx.gameCounter.update({
              where: { id: existing.id },
              data: { nextNumber: { increment: 1 } },
            });
            prefix = existing.prefix;
            sequence = updated.nextNumber - 1;
          } else {
            prefix = gamePrefix(
              gameName,
              counters.map((counter) => counter.prefix),
            );
            sequence = 1;
            await tx.gameCounter.create({
              data: { ownerId, gameNameNormalized, prefix, nextNumber: 2 },
            });
          }

          return tx.account.create({
            data: {
              ownerId,
              accountCode: buildAccountCode(prefix, sequence),
              gameName,
              gameNameNormalized,
              accountName: data.accountName,
              description: emptyToNull(data.description),
              imageUrl: emptyToNull(data.imageUrl),
              purchasePrice: BigInt(data.purchasePrice),
              purchaseDate: dateInputToUtc(data.purchaseDate),
              purchasedFrom: emptyToNull(data.purchasedFrom),
              notes: emptyToNull(data.notes),
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034")
      ) {
        continue;
      }
      throw error;
    }
  }
  throw new AppError("CONFLICT", "Unable to allocate a unique account code. Please retry.");
}

export async function updateAccount(ownerId: string, accountId: string, input: AccountInput) {
  const data = accountInputSchema.parse(input);
  const account = await db.account.findFirst({
    where: { id: accountId, ownerId, deletedAt: null },
    include: { sale: { select: { id: true } } },
  });
  if (!account) throw new AppError("NOT_FOUND", "Account not found");
  if (account.sale) throw new AppError("CONFLICT", "Sold accounts are read-only");

  const updated = await db.account.update({
    where: { id: account.id },
    data: {
      gameName: normalizeName(data.gameName),
      gameNameNormalized: normalizeCategory(data.gameName),
      accountName: data.accountName,
      description: emptyToNull(data.description),
      imageUrl: emptyToNull(data.imageUrl),
      purchasePrice: BigInt(data.purchasePrice),
      purchaseDate: dateInputToUtc(data.purchaseDate),
      purchasedFrom: emptyToNull(data.purchasedFrom),
      notes: emptyToNull(data.notes),
    },
  });
  if (account.imageUrl !== updated.imageUrl) await removeStoredImage(account.imageUrl);
  return updated;
}

export async function archiveAccount(ownerId: string, accountId: string) {
  return db.$transaction(async (tx) => {
    const account = await tx.account.findFirst({
      where: { id: accountId, ownerId, deletedAt: null },
      include: {
        sale: { select: { id: true } },
        _count: { select: { listings: { where: { status: "ACTIVE" } } } },
      },
    });
    if (!account) throw new AppError("NOT_FOUND", "Account not found");
    if (account.sale)
      throw new AppError("CONFLICT", "Sold accounts must remain in financial history");
    if (account._count.listings > 0) {
      throw new AppError("CONFLICT", "Cancel all active listings before deleting this account");
    }

    return tx.account.update({ where: { id: account.id }, data: { deletedAt: new Date() } });
  });
}

export async function getStocksData(ownerId: string, query: StockQuery) {
  const { q, game, category, sort, page } = stockQuerySchema.parse(query);
  const searchWhere: Prisma.AccountWhereInput = q
    ? {
        OR: [
          { accountName: { contains: q, mode: "insensitive" } },
          { gameName: { contains: q, mode: "insensitive" } },
          { id: { contains: q, mode: "insensitive" } },
          { accountCode: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};
  const baseWhere: Prisma.AccountWhereInput = {
    ownerId,
    deletedAt: null,
    ...(game ? { gameNameNormalized: normalizeCategory(game) } : {}),
    ...searchWhere,
  };
  const where: Prisma.AccountWhereInput = { ...baseWhere, ...categoryWhere(category) };
  const orderBy: Prisma.AccountOrderByWithRelationInput[] =
    sort === "oldest"
      ? [{ purchaseDate: "asc" }]
      : sort === "purchaseHigh"
        ? [{ purchasePrice: "desc" }, { purchaseDate: "desc" }]
        : sort === "purchaseLow"
          ? [{ purchasePrice: "asc" }, { purchaseDate: "desc" }]
          : sort === "name"
            ? [{ accountName: "asc" }]
            : sort === "saleNewest"
              ? [{ sale: { soldAt: "desc" } }, { purchaseDate: "desc" }]
              : sort === "profitHigh"
                ? [{ sale: { netProfit: "desc" } }, { purchaseDate: "desc" }]
                : sort === "profitLow"
                  ? [{ sale: { netProfit: "asc" } }, { purchaseDate: "desc" }]
                  : [{ purchaseDate: "desc" }, { createdAt: "desc" }];
  const pageSize = 12;
  const [totalAccounts, totalFiltered, all, available, listed, sold] = await Promise.all([
    db.account.count({ where: { ownerId, deletedAt: null } }),
    db.account.count({ where }),
    db.account.count({ where: baseWhere }),
    db.account.count({ where: { ...baseWhere, ...categoryWhere("available") } }),
    db.account.count({ where: { ...baseWhere, ...categoryWhere("listed") } }),
    db.account.count({ where: { ...baseWhere, ...categoryWhere("sold") } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, totalPages);
  const accounts =
    sort === "statusName"
      ? await (async () => {
          const filters = [Prisma.sql`a."ownerId" = ${ownerId}`, Prisma.sql`a."deletedAt" IS NULL`];
          if (game) filters.push(Prisma.sql`a."gameNameNormalized" = ${normalizeCategory(game)}`);
          if (q) {
            const pattern = `%${q}%`;
            filters.push(
              Prisma.sql`(a."accountName" ILIKE ${pattern} OR a."gameName" ILIKE ${pattern} OR a.id ILIKE ${pattern} OR a."accountCode" ILIKE ${pattern})`,
            );
          }
          if (category === "available") {
            filters.push(
              Prisma.sql`NOT EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id)`,
              Prisma.sql`NOT EXISTS (SELECT 1 FROM "Listing" l WHERE l."accountId" = a.id AND l.status = 'ACTIVE')`,
            );
          } else if (category === "listed") {
            filters.push(
              Prisma.sql`NOT EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id)`,
              Prisma.sql`EXISTS (SELECT 1 FROM "Listing" l WHERE l."accountId" = a.id AND l.status = 'ACTIVE')`,
            );
          } else if (category === "sold") {
            filters.push(Prisma.sql`EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id)`);
          }
          const ids = await db.$queryRaw<{ id: string }[]>(
            Prisma.sql`SELECT a.id FROM "Account" a
              WHERE ${Prisma.join(filters, " AND ")}
              ORDER BY CASE
                WHEN EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id) THEN 2
                WHEN EXISTS (SELECT 1 FROM "Listing" l WHERE l."accountId" = a.id AND l.status = 'ACTIVE') THEN 1
                ELSE 0
              END ASC,
              lower(a."accountName") ASC,
              a.id ASC
              LIMIT ${pageSize} OFFSET ${(currentPage - 1) * pageSize}`,
          );
          if (ids.length === 0) return [];
          const records = await db.account.findMany({
            where: { id: { in: ids.map((row) => row.id) } },
            include: stockAccountInclude,
          });
          const byId = new Map(records.map((record) => [record.id, record]));
          return ids.map((row) => byId.get(row.id)!);
        })()
      : await db.account.findMany({
          where,
          include: stockAccountInclude,
          orderBy,
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
        });

  return {
    accounts,
    counts: { all, available, listed, sold },
    totalAccounts,
    totalFiltered,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function getAccountDetail(ownerId: string, accountId: string) {
  const account = await db.account.findFirst({
    where: { id: accountId, ownerId, deletedAt: null },
    include: accountDetailInclude,
  });
  if (!account) throw new AppError("NOT_FOUND", "Account not found");
  return account;
}

export async function getAccountGames(ownerId: string) {
  const games = await db.account.findMany({
    where: { ownerId, deletedAt: null },
    select: { gameName: true, gameNameNormalized: true },
    distinct: ["gameNameNormalized"],
    orderBy: { gameName: "asc" },
  });
  return games.map((game) => game.gameName);
}
