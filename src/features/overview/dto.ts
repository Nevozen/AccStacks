import { DateTime } from "luxon";
import type { getAnalytics } from "@/services/analytics";
import { formatMoney, toSafeNumber } from "@/lib/money";
import type { ChartPoint, OverviewDto, PerformancePoint } from "./types";

type Analytics = Awaited<ReturnType<typeof getAnalytics>>;
type Series = Analytics["trends"];

function mapPoints(rows: Series): ChartPoint[] {
  return rows.map((row) => ({
    period: row.period,
    label: row.period,
    sales: Number(row.sales),
    revenue: toSafeNumber(row.revenue),
    netProfit: toSafeNumber(row.netProfit),
    revenueText: formatMoney(row.revenue),
    netProfitText: formatMoney(row.netProfit),
  }));
}

function fillTrend(data: Analytics, timezone: string): ChartPoint[] {
  if (data.trends.length === 0) return [];
  const daily = data.granularity === "day";
  const format = daily ? "yyyy-MM-dd" : "yyyy-MM";
  const unit = daily ? "days" : "months";
  const rows = new Map(data.trends.map((row) => [row.period, row]));
  const firstPeriod = data.trends[0]!.period;
  const start = data.range.from
    ? DateTime.fromJSDate(data.range.from).setZone(timezone)
    : DateTime.fromFormat(firstPeriod, format, { zone: timezone });
  const end = data.range.toExclusive
    ? DateTime.fromJSDate(data.range.toExclusive).setZone(timezone)
    : DateTime.now().setZone(timezone).plus({ months: 1 }).startOf("month");
  const points: ChartPoint[] = [];
  let cursor = start;
  let guard = 0;
  while (cursor < end && guard < 3700) {
    const period = cursor.toFormat(format);
    const row = rows.get(period);
    points.push({
      period,
      label: cursor.toFormat(daily ? "dd MMM" : "MMM yyyy"),
      sales: Number(row?.sales ?? 0n),
      revenue: row ? toSafeNumber(row.revenue) : 0,
      netProfit: row ? toSafeNumber(row.netProfit) : 0,
      revenueText: formatMoney(row?.revenue ?? 0n),
      netProfitText: formatMoney(row?.netProfit ?? 0n),
    });
    cursor = cursor.plus({ [unit]: 1 });
    guard += 1;
  }
  return points;
}

function mapPerformance(rows: Analytics["gamePerformance"]): PerformancePoint[] {
  return rows.map((row) => ({
    name: row.name,
    sales: Number(row.sales),
    revenue: toSafeNumber(row.revenue),
    netProfit: toSafeNumber(row.netProfit),
    revenueText: formatMoney(row.revenue),
    netProfitText: formatMoney(row.netProfit),
  }));
}

export function toOverviewDto(
  data: Analytics,
  timezone: string,
  rangeInput: { range: string; from?: string; to?: string },
): OverviewDto {
  return {
    query: {
      range: rangeInput.range,
      from: rangeInput.from ?? data.range.fromInput,
      to: rangeInput.to ?? data.range.toInput,
    },
    inventory: {
      ...data.inventory,
      inventoryValue: data.inventory.inventoryValue.toString(),
      estimatedUnrealizedProfit: data.inventory.estimatedUnrealizedProfit.toString(),
    },
    financial: {
      ...data.financial,
      totalRevenue: data.financial.totalRevenue.toString(),
      costOfGoodsSold: data.financial.costOfGoodsSold.toString(),
      totalAdditionalExpenses: data.financial.totalAdditionalExpenses.toString(),
      netProfit: data.financial.netProfit.toString(),
      averageProfitPerSale: data.financial.averageProfitPerSale?.toString() ?? null,
      averageSellingPrice: data.financial.averageSellingPrice?.toString() ?? null,
    },
    trends: fillTrend(data, timezone),
    monthlySales: mapPoints(data.monthlySales),
    gamePerformance: mapPerformance(data.gamePerformance),
    marketplacePerformance: mapPerformance(data.marketplacePerformance),
    holdingPeriod: data.holdingPeriod.map((row) => ({
      name: row.name,
      averageDays: Math.round(row.averageDays * 10) / 10,
    })),
    recentSales: data.recentSales.map((sale) => ({
      id: sale.id,
      accountId: sale.account.id,
      accountName: sale.account.accountName,
      gameName: sale.account.gameName,
      marketplace: sale.marketplace,
      purchasePrice: sale.purchasePrice.toString(),
      sellingPrice: sale.sellingPrice.toString(),
      totalExpenses: sale.totalExpenses.toString(),
      netProfit: sale.netProfit.toString(),
      soldAt: sale.soldAt.toISOString(),
    })),
  };
}
