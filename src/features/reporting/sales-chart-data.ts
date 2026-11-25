import { DateTime } from "luxon";
import { formatMoney } from "@/lib/money";
import type { ReportProps } from "./report-ui";

export type SalesChartPoint = {
  period: string;
  label: string;
  date: string;
  sales: number;
  revenue: number;
  netProfit: number;
  revenueText: string;
  netProfitText: string;
};

type TrendData = Pick<ReportProps["data"], "trends" | "range" | "granularity">;

export function toSalesChartData(data: TrendData, timezone: string): SalesChartPoint[] {
  if (!data.trends.length) return [];
  const daily = data.granularity === "day";
  const unit = data.granularity;
  const step = daily ? { days: 1 } : { months: 1 };
  const keyFormat = daily ? "yyyy-MM-dd" : "yyyy-MM";
  const zone = { zone: timezone, locale: "en" };
  const parsePeriod = (period: string) => DateTime.fromFormat(period, keyFormat, zone);
  const rows = new Map(data.trends.map((row) => [row.period, row]));
  const start = data.range.from
    ? DateTime.fromJSDate(data.range.from, zone).startOf(unit)
    : parsePeriod(data.trends[0]!.period);
  const observedEnd = parsePeriod(data.trends.at(-1)!.period).plus(step);
  const currentEnd = DateTime.now().setZone(timezone).startOf(unit).plus(step);
  const visibleEnd = DateTime.max(observedEnd, currentEnd);
  const end = data.range.toExclusive
    ? DateTime.min(DateTime.fromJSDate(data.range.toExclusive, zone), visibleEnd)
    : visibleEnd;

  function point(date: DateTime): SalesChartPoint {
    const period = date.toFormat(keyFormat);
    const row = rows.get(period);
    const revenue = row?.revenue ?? 0n;
    const netProfit = row?.netProfit ?? 0n;
    return {
      period,
      label: date.toFormat(daily ? "dd MMM" : "MMM yy"),
      date: date.toFormat(daily ? "dd MMM yyyy" : "MMM yyyy"),
      sales: Number(row?.sales ?? 0n),
      // Recharts uses numbers for positions; tooltips keep the exact integer Rupiah values.
      revenue: Number(revenue),
      netProfit: Number(netProfit),
      revenueText: formatMoney(revenue),
      netProfitText: formatMoney(netProfit),
    };
  }

  if (end.diff(start, "months").months > 240) {
    return data.trends.map((row) => point(parsePeriod(row.period)));
  }
  const points = [];
  for (let date = start; date < end; date = date.plus(step)) points.push(point(date));
  return points;
}
