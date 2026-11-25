import { ChartNoAxesColumn } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { formatReportPeriod } from "./report-period";
import { ReportPanel, type ReportProps } from "./report-ui";
import { SalesChart } from "./sales-chart";
import { toSalesChartData } from "./sales-chart-data";

export function SalesPerformance({
  data,
  period,
  timezone,
  className,
  children,
}: ReportProps & { className?: string; children?: React.ReactNode }) {
  const points = toSalesChartData(data, timezone);
  return (
    <ReportPanel
      id="sales-performance"
      title="Sales performance"
      description={`${formatReportPeriod(period)} / ${data.granularity === "day" ? "By day" : "By month"}`}
      className={className}
      action={
        points.length ? (
          <ul
            className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
            aria-label="Chart legend"
          >
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-chart-1" aria-hidden="true" /> Revenue
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-chart-2" aria-hidden="true" /> Net profit
            </li>
          </ul>
        ) : null
      }
    >
      <div className="px-panel pb-panel">
        {points.length ? (
          <SalesChart points={points} />
        ) : (
          <EmptyState
            icon={ChartNoAxesColumn}
            title="No completed sales in this period"
            description={
              data.inventory.soldAccounts
                ? "Choose a different reporting period to see earlier transactions."
                : "Sales performance will appear after your first completed sale."
            }
            variant="inline"
            className="rounded-lg bg-muted/70 p-3"
          />
        )}
      </div>
      {children}
    </ReportPanel>
  );
}
