import type { Metadata } from "next";
import { OverviewWorkspace } from "@/features/reporting/overview-workspace";
import { loadReport, type ReportSearchParams } from "@/server/reporting";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage({ searchParams }: { searchParams: ReportSearchParams }) {
  return <OverviewWorkspace {...await loadReport(searchParams, "overview")} />;
}
