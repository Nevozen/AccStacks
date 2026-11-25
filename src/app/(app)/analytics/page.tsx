import type { Metadata } from "next";
import { AnalyticsWorkspace } from "@/features/reporting/analytics-workspace";
import { loadReport, type ReportSearchParams } from "@/server/reporting";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: ReportSearchParams;
}) {
  return <AnalyticsWorkspace {...await loadReport(searchParams, "analytics")} />;
}
