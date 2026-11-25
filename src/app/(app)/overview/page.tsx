import type { Metadata } from "next";
import { OverviewWorkspace } from "@/features/reporting/overview-workspace";
import { loadReport, type ReportSearchParams } from "@/server/reporting";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: { searchParams: ReportSearchParams }) {
  const report = await loadReport(searchParams, "overview");
  return report ? <OverviewWorkspace {...report} /> : null;
}
