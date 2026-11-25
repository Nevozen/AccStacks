import { Prisma } from "@/generated/prisma/client";
import { DateTime } from "luxon";
import { resolveDateRange, resolvePreviousDateRange } from "@/lib/dates";
import {
  calculateAverage,
  calculateCapitalPosition,
  calculateChange,
  calculatePercentage,
} from "@/lib/finance";
import { overviewQuerySchema, type OverviewQuery } from "@/schemas/overview";
import { db } from "@/server/db";

function salesWhere(ownerId: string, from: Date | null, toExclusive: Date | null) {
  const filters = [Prisma.sql`a."ownerId" = ${ownerId}`];
  if (from) filters.push(Prisma.sql`s."soldAt" >= ${from}`);
  if (toExclusive) filters.push(Prisma.sql`s."soldAt" < ${toExclusive}`);
  return Prisma.join(filters, " AND ");
}

export async function getAnalytics(
  ownerId: string,
  query: OverviewQuery,
  timezone: string,
  now: DateTime = DateTime.now(),
  view: "full" | "overview" | "analytics" = "full",
) {
  const parsed = overviewQuerySchema.parse(query);
  const range = resolveDateRange({ ...parsed, timezone, now });
  const where = salesWhere(ownerId, range.from, range.toExclusive);
  const salesFrom = Prisma.sql`FROM "Sale" s JOIN "Account" a ON a.id = s."accountId" WHERE ${where}`;
  const previousRange = resolvePreviousDateRange({ ...parsed, timezone, now });
  const previousSalesFrom = previousRange.label
    ? Prisma.sql`FROM "Sale" s JOIN "Account" a ON a.id = s."accountId" WHERE ${salesWhere(ownerId, previousRange.from, previousRange.toExclusive)}`
    : null;
  const allTimeSalesFrom = Prisma.sql`FROM "Sale" s JOIN "Account" a ON a.id = s."accountId" WHERE ${salesWhere(ownerId, null, null)}`;
  const saleDateWhere: Prisma.SaleWhereInput = {
    account: { ownerId },
    ...(range.from || range.toExclusive
      ? {
          soldAt: {
            ...(range.from ? { gte: range.from } : {}),
            ...(range.toExclusive ? { lt: range.toExclusive } : {}),
          },
        }
      : {}),
  };
  const daily =
    parsed.range !== "thisYear" &&
    parsed.range !== "all" &&
    (parsed.range !== "custom" ||
      Boolean(
        range.from &&
        range.toExclusive &&
        range.toExclusive.getTime() - range.from.getTime() <= 62 * 24 * 60 * 60 * 1000,
      ));
  const periodFormat = daily ? "YYYY-MM-DD" : "YYYY-MM";
  const detailLimit = view === "analytics" ? Prisma.empty : Prisma.sql`LIMIT 8`;
  const gameLimit = view === "overview" ? Prisma.sql`LIMIT 4` : detailLimit;
  const inventoryValueQuery = db.$queryRaw<{ inventoryValue: bigint; unrealizedProfit: bigint }[]>`
    SELECT
      COALESCE(SUM(a."purchasePrice"), 0)::bigint AS "inventoryValue",
      COALESCE(SUM(CASE WHEN asking."maximumPrice" IS NOT NULL
        THEN asking."maximumPrice" - a."purchasePrice" ELSE 0 END), 0)::bigint AS "unrealizedProfit"
    FROM "Account" a
    LEFT JOIN (
      SELECT "accountId", MAX("listingPrice") AS "maximumPrice"
      FROM "Listing" WHERE status = 'ACTIVE' GROUP BY "accountId"
    ) asking ON asking."accountId" = a.id
    WHERE a."ownerId" = ${ownerId}
      AND a."deletedAt" IS NULL
      AND NOT EXISTS (SELECT 1 FROM "Sale" sold WHERE sold."accountId" = a.id)
  `;
  const [
    inventoryRows,
    financialRows,
    trendRows,
    monthlyRows,
    gameRows,
    marketplaceRows,
    holdingRows,
    totalAccounts,
    availableAccounts,
    listedAccounts,
    soldAccounts,
    activeListings,
    recentSales,
  ] = await Promise.all([
    inventoryValueQuery,
    db.$queryRaw<{ sales: bigint; revenue: bigint; cogs: bigint; expenses: bigint }[]>(
      Prisma.sql`SELECT COUNT(*)::bigint AS sales,
        COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."purchasePrice"), 0)::bigint AS cogs,
        COALESCE(SUM(s."totalExpenses"), 0)::bigint AS expenses ${salesFrom}`,
    ),
    db.$queryRaw<{ period: string; sales: bigint; revenue: bigint; netProfit: bigint }[]>(
      Prisma.sql`SELECT TO_CHAR(s."soldAt" AT TIME ZONE ${timezone}, ${periodFormat}) AS period,
        COUNT(*)::bigint AS sales,
        COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."netProfit"), 0)::bigint AS "netProfit"
        ${salesFrom} GROUP BY period ORDER BY period ASC`,
    ),
    view === "overview"
      ? Promise.resolve([])
      : db.$queryRaw<{ period: string; sales: bigint; revenue: bigint; netProfit: bigint }[]>(
          Prisma.sql`SELECT TO_CHAR(s."soldAt" AT TIME ZONE ${timezone}, 'YYYY-MM') AS period,
        COUNT(*)::bigint AS sales,
        COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."netProfit"), 0)::bigint AS "netProfit"
        ${salesFrom} GROUP BY period ORDER BY period ASC`,
        ),
    db.$queryRaw<{ name: string; sales: bigint; revenue: bigint; netProfit: bigint }[]>(
      Prisma.sql`SELECT MAX(a."gameName") AS name,
        COUNT(*)::bigint AS sales,
        COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."netProfit"), 0)::bigint AS "netProfit"
        ${salesFrom} GROUP BY a."gameNameNormalized" ORDER BY "netProfit" DESC, name ASC
        ${gameLimit}`,
    ),
    view === "overview"
      ? Promise.resolve([])
      : db.$queryRaw<{ name: string; sales: bigint; revenue: bigint; netProfit: bigint }[]>(
          Prisma.sql`SELECT MAX(s.marketplace) AS name,
        COUNT(*)::bigint AS sales,
        COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."netProfit"), 0)::bigint AS "netProfit"
        ${salesFrom} GROUP BY s."marketplaceNormalized" ORDER BY revenue DESC, name ASC ${detailLimit}`,
        ),
    view === "overview"
      ? Promise.resolve([])
      : db.$queryRaw<{ name: string; averageDays: number }[]>`
      SELECT MAX(a."gameName") AS name,
        AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - a."purchaseDate")) / 86400)::float AS "averageDays"
      FROM "Account" a
      WHERE a."ownerId" = ${ownerId}
        AND a."deletedAt" IS NULL
        AND NOT EXISTS (SELECT 1 FROM "Sale" s WHERE s."accountId" = a.id)
      GROUP BY a."gameNameNormalized"
      ORDER BY "averageDays" DESC, name ASC
      ${detailLimit}
    `,
    db.account.count({ where: { ownerId, deletedAt: null } }),
    db.account.count({
      where: { ownerId, deletedAt: null, sale: null, listings: { none: { status: "ACTIVE" } } },
    }),
    db.account.count({
      where: { ownerId, deletedAt: null, sale: null, listings: { some: { status: "ACTIVE" } } },
    }),
    db.account.count({ where: { ownerId, deletedAt: null, sale: { isNot: null } } }),
    db.listing.count({
      where: { status: "ACTIVE", account: { ownerId, deletedAt: null, sale: null } },
    }),
    view === "analytics"
      ? Promise.resolve([])
      : db.sale.findMany({
          where: saleDateWhere,
          include: {
            account: { select: { id: true, accountCode: true, accountName: true, gameName: true } },
          },
          orderBy: [{ soldAt: "desc" }, { id: "desc" }],
          take: view === "overview" ? 5 : 8,
        }),
  ]);

  const [previousFinancialRows, allTimeFinancialRows, settings] = await Promise.all([
    previousSalesFrom
      ? db.$queryRaw<{ sales: bigint; revenue: bigint; cogs: bigint; expenses: bigint }[]>(
          Prisma.sql`SELECT COUNT(*)::bigint AS sales,
            COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
            COALESCE(SUM(s."purchasePrice"), 0)::bigint AS cogs,
            COALESCE(SUM(s."totalExpenses"), 0)::bigint AS expenses ${previousSalesFrom}`,
        )
      : Promise.resolve([]),
    db.$queryRaw<{ revenue: bigint; cogs: bigint; expenses: bigint }[]>(
      Prisma.sql`SELECT COALESCE(SUM(s."sellingPrice"), 0)::bigint AS revenue,
        COALESCE(SUM(s."purchasePrice"), 0)::bigint AS cogs,
        COALESCE(SUM(s."totalExpenses"), 0)::bigint AS expenses ${allTimeSalesFrom}`,
    ),
    db.userSettings.findUnique({ where: { userId: ownerId }, select: { capital: true } }),
  ]);

  const inventoryValues = inventoryRows[0] ?? { inventoryValue: 0n, unrealizedProfit: 0n };
  const financial = financialRows[0] ?? { sales: 0n, revenue: 0n, cogs: 0n, expenses: 0n };
  const previous = previousFinancialRows[0] ?? { sales: 0n, revenue: 0n, cogs: 0n, expenses: 0n };
  const allTime = allTimeFinancialRows[0] ?? { revenue: 0n, cogs: 0n, expenses: 0n };
  const completedSales = Number(financial.sales);
  const netProfit = financial.revenue - financial.cogs - financial.expenses;
  const previousNetProfit = previous.revenue - previous.cogs - previous.expenses;
  const retainedNetProfit = allTime.revenue - allTime.cogs - allTime.expenses;
  const capitalPosition = calculateCapitalPosition({
    capital: settings?.capital ?? 0n,
    retainedNetProfit,
    inventoryValue: inventoryValues.inventoryValue,
  });

  return {
    range,
    granularity: daily ? ("day" as const) : ("month" as const),
    inventory: {
      totalAccounts,
      availableAccounts,
      listedAccounts,
      soldAccounts,
      activeListings,
      inventoryValue: inventoryValues.inventoryValue,
      estimatedUnrealizedProfit: inventoryValues.unrealizedProfit,
    },
    financial: {
      completedSales,
      totalRevenue: financial.revenue,
      costOfGoodsSold: financial.cogs,
      totalAdditionalExpenses: financial.expenses,
      netProfit,
      profitMargin: calculatePercentage(netProfit, financial.revenue),
      returnOnInvestment: calculatePercentage(netProfit, financial.cogs),
      averageProfitPerSale: calculateAverage(netProfit, completedSales),
      averageSellingPrice: calculateAverage(financial.revenue, completedSales),
    },
    comparison: {
      label: previousRange.label,
      revenue: calculateChange(financial.revenue, previous.revenue),
      netProfit: calculateChange(netProfit, previousNetProfit),
      sales: calculateChange(financial.sales, previous.sales),
      hasBaseline: {
        revenue: previous.revenue !== 0n,
        netProfit: previousNetProfit !== 0n,
        sales: previous.sales !== 0n,
      },
    },
    capitalPosition: {
      capital: settings?.capital ?? 0n,
      retainedNetProfit,
      ...capitalPosition,
    },
    trends: trendRows,
    monthlySales: monthlyRows,
    gamePerformance: gameRows,
    marketplacePerformance: marketplaceRows,
    holdingPeriod: holdingRows,
    recentSales,
  };
}
