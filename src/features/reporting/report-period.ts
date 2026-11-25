import type { DateRangeKey } from "@/lib/dates";

export type ReportPeriod = { range: DateRangeKey; from: string; to: string };

export const periodLabels: Record<DateRangeKey, string> = {
  last7: "Last 7 days",
  last30: "Last 30 days",
  thisMonth: "This month",
  lastMonth: "Last month",
  thisYear: "This year",
  all: "All time",
  custom: "Custom range",
};

export function reportHref(path: string, { range, from, to }: ReportPeriod) {
  const params = new URLSearchParams({ range });
  if (range === "custom") {
    params.set("from", from);
    params.set("to", to);
  }
  return `${path}?${params}`;
}

const periodFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export function formatReportPeriod({ from, to }: ReportPeriod) {
  return from && to ? periodFormatter.formatRange(new Date(from), new Date(to)) : "All time";
}
