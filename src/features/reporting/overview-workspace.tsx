import Link from "next/link";
import { Plus } from "lucide-react";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { Currency } from "@/lib/money";
import { FinancialPosition, InventoryOverview, ProfitOverview } from "./overview-cards";
import { PeriodPicker } from "./period-picker";
import { RecentSales } from "./recent-sales";
import { reportHref } from "./report-period";
import { ReportActions, ReportLink, ReportPanel, type ReportProps } from "./report-ui";
import { SalesPerformance } from "./sales-performance";

export function OverviewWorkspace(props: ReportProps) {
  const { data, period, timezone, currency } = props;
  const analyticsHref = reportHref("/analytics", period);

  return (
    <div className="space-y-grid">
      <PageHeader
        title="Overview"
        actions={
          <>
            <PeriodPicker period={period} />
            <Button asChild>
              <Link href="/stocks?add=1">
                <Plus aria-hidden="true" /> Add Account
              </Link>
            </Button>
            <ReportActions period={period} overview />
          </>
        }
      />
      <div className="grid gap-grid md:grid-cols-12">
        <FinancialPosition
          {...data.capitalPosition}
          currency={currency}
          inventoryValue={data.inventory.inventoryValue}
        />
        <ProfitOverview
          financial={data.financial}
          comparison={data.comparison}
          currency={currency}
        />
        <SalesPerformance {...props} className="md:col-span-7" />
        <InventoryOverview inventory={data.inventory} />
        {data.financial.completedSales > 0 ? (
          <>
            <ReportPanel
              id="top-games"
              title="Top performing games"
              className="md:col-span-7"
              action={
                <ReportLink href={`${analyticsHref}#game-profitability`}>Game breakdown</ReportLink>
              }
            >
              <ol className="divide-y px-panel pb-2">
                {data.gamePerformance.map((game, index) => (
                  <li key={game.name} className="flex items-center gap-2.5 py-2">
                    <span
                      className="w-6 shrink-0 font-mono text-xs text-muted-foreground tabular-nums"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                      <p className="text-sm font-medium wrap-anywhere">{game.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {game.sales.toString()} {game.sales === 1n ? "sale" : "sales"}
                      </p>
                    </div>
                    <Money
                      currency={currency}
                      value={game.netProfit}
                      colored
                      className="max-w-[45%] text-right text-sm wrap-anywhere"
                    />
                  </li>
                ))}
              </ol>
            </ReportPanel>
            <SalesSummary financial={data.financial} currency={currency} />
          </>
        ) : null}
        <RecentSales sales={data.recentSales} timezone={timezone} currency={currency} />
      </div>
    </div>
  );
}

function SalesSummary({
  financial,
  currency,
}: {
  financial: ReportProps["data"]["financial"];
  currency: Currency;
}) {
  const items = [
    { label: "Completed Sales", value: financial.completedSales },
    {
      label: "Average Profit per Sale",
      value:
        financial.averageProfitPerSale === null ? (
          "N/A"
        ) : (
          <Money currency={currency} value={financial.averageProfitPerSale} colored />
        ),
    },
    {
      label: "Average Selling Price",
      value:
        financial.averageSellingPrice === null ? (
          "N/A"
        ) : (
          <Money currency={currency} value={financial.averageSellingPrice} />
        ),
    },
  ];
  return (
    <ReportPanel
      id="sales-summary"
      title="Sales summary"
      scope="Selected period"
      className="md:col-span-5"
    >
      <dl className="divide-y px-panel pb-2">
        {items.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-3 py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="max-w-1/2 text-right font-semibold tabular-nums wrap-anywhere">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </ReportPanel>
  );
}
