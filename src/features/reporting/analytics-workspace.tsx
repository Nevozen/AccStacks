import { ChevronDown } from "lucide-react";
import { DateTime } from "luxon";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPercentage, type Currency } from "@/lib/money";
import { PeriodPicker } from "./period-picker";
import { formatReportPeriod } from "./report-period";
import {
  MetricHelp,
  PeriodChange,
  ReportActions,
  ReportLink,
  ReportPanel,
  type ReportProps,
} from "./report-ui";
import { SalesPerformance } from "./sales-performance";

export function AnalyticsWorkspace(props: ReportProps) {
  const { data, period, currency } = props;
  const { financial, inventory, comparison } = data;
  const costs = [
    { label: "Cost of Goods Sold", value: financial.costOfGoodsSold },
    { label: "Additional Expenses", value: financial.totalAdditionalExpenses },
  ];

  return (
    <div className="space-y-grid">
      <PageHeader
        title="Analytics"
        actions={
          <>
            <PeriodPicker period={period} />
            <ReportActions period={period} />
          </>
        }
      />
      <div className="grid gap-grid md:grid-cols-12">
        <ReportPanel
          id="profit-and-loss"
          title="Profit and loss"
          description={formatReportPeriod(period)}
          className="md:col-span-7"
        >
          <dl className="grid grid-cols-2 gap-3 px-panel">
            <div>
              <dt className="text-xs text-muted-foreground">Total Revenue</dt>
              <dd className="mt-1 text-xl tracking-tight wrap-anywhere">
                <Money
                  currency={currency}
                  value={financial.totalRevenue}
                  className="font-semibold"
                />
              </dd>
              {comparison.label ? (
                <dd>
                  <PeriodChange comparison={comparison} metric="revenue" className="mt-1" />
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Net Profit</dt>
              <dd className="mt-1 text-xl tracking-tight wrap-anywhere">
                <Money
                  currency={currency}
                  value={financial.netProfit}
                  colored
                  className="font-semibold"
                />
              </dd>
              {comparison.label ? (
                <dd>
                  <PeriodChange comparison={comparison} metric="netProfit" className="mt-1" />
                </dd>
              ) : null}
            </div>
          </dl>
          <dl className="mx-panel mt-3 divide-y border-t pb-2">
            {costs.map(({ label, value }) => (
              <div key={label} className="flex justify-between gap-3 py-2 text-sm">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">
                  <Money currency={currency} value={value} />
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 py-2 text-sm">
              <dt className="text-muted-foreground">Profit Margin</dt>
              <dd className="font-medium tabular-nums">
                {formatPercentage(financial.profitMargin)}
              </dd>
            </div>
            <div className="flex justify-between gap-3 py-2 text-sm">
              <dt className="text-muted-foreground">Return on Investment</dt>
              <dd className="font-medium tabular-nums">
                {formatPercentage(financial.returnOnInvestment)}
              </dd>
            </div>
          </dl>
        </ReportPanel>
        <ReportPanel
          id="inventory-outlook"
          title="Inventory outlook"
          scope="Current"
          className="flex flex-col md:col-span-5"
          action={<ReportLink href="/listings">Listings</ReportLink>}
        >
          <div className="flex flex-1 flex-col px-panel pb-panel">
            <dl>
              <dt className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                Estimated Unrealized Profit
                <MetricHelp label="How estimated unrealized profit is calculated">
                  Highest active asking price less purchase cost, counted once per unsold listed
                  account. Asking prices are not completed sales.
                </MetricHelp>
              </dt>
              <dd className="mt-0.5 text-2xl tracking-tight wrap-anywhere">
                <Money
                  currency={currency}
                  value={inventory.estimatedUnrealizedProfit}
                  colored
                  className="font-semibold"
                />
              </dd>
            </dl>
            <p className="mt-1 text-xs text-muted-foreground">
              An estimate from current listings, not realized revenue.
            </p>
            <dl className="mt-auto divide-y pt-4">
              <div className="flex justify-between gap-3 border-t py-2 text-sm">
                <dt className="text-muted-foreground">Inventory Value</dt>
                <dd className="text-right">
                  <Money currency={currency} value={inventory.inventoryValue} />
                </dd>
              </div>
              <div className="flex justify-between gap-3 pt-2 text-sm">
                <dt className="text-muted-foreground">Active Listings</dt>
                <dd className="font-medium tabular-nums">{inventory.activeListings}</dd>
              </div>
            </dl>
          </div>
        </ReportPanel>
        <SalesPerformance {...props} className="md:col-span-12">
          {data.monthlySales.length ? (
            <MonthlySales data={data.monthlySales} comparison={comparison} currency={currency} />
          ) : null}
        </SalesPerformance>
        {data.gamePerformance.length ? (
          <>
            <SalesBreakdown
              title="Game profitability"
              id="game-profitability"
              nameLabel="Game"
              rows={data.gamePerformance}
              currency={currency}
            />
            <SalesBreakdown
              title="Marketplace revenue"
              id="marketplace-revenue"
              nameLabel="Marketplace"
              rows={data.marketplacePerformance}
              currency={currency}
            />
          </>
        ) : null}
        {data.holdingPeriod.length ? (
          <ReportPanel
            id="inventory-holding"
            title="Inventory holding period"
            scope="Current"
            description="Average age of unsold accounts by game."
            className="md:col-span-12"
            action={<ReportLink href="/stocks">Stocks</ReportLink>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-panel">Game</TableHead>
                  <TableHead className="pr-panel text-right">Average age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.holdingPeriod.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="pl-panel wrap-anywhere">{row.name}</TableCell>
                    <TableCell className="pr-panel text-right whitespace-nowrap tabular-nums">
                      {new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(
                        row.averageDays,
                      )}{" "}
                      days
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ReportPanel>
        ) : null}
      </div>
    </div>
  );
}

function MonthlySales({
  data,
  comparison,
  currency,
}: {
  data: ReportProps["data"]["monthlySales"];
  comparison: ReportProps["data"]["comparison"];
  currency: Currency;
}) {
  return (
    <details className="group border-t">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-panel text-sm font-medium focus-visible:-outline-offset-2 [&::-webkit-details-marker]:hidden">
        Monthly sales breakdown
        <ChevronDown
          className="size-4 text-muted-foreground group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      {comparison.label ? (
        <PeriodChange comparison={comparison} metric="sales" className="px-panel pb-2" />
      ) : null}
      <Table scrollLabel="Monthly sales breakdown">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-panel">Month</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="pr-panel text-right">Net profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.period}>
              <TableCell className="pl-panel whitespace-nowrap">
                {DateTime.fromISO(row.period, { locale: "en" }).toFormat("MMM yyyy")}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.sales.toString()}</TableCell>
              <TableCell className="text-right">
                <Money currency={currency} value={row.revenue} />
              </TableCell>
              <TableCell className="pr-panel text-right">
                <Money currency={currency} value={row.netProfit} colored />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </details>
  );
}

function SalesBreakdown({
  id,
  title,
  nameLabel,
  rows,
  currency,
}: {
  id: string;
  title: string;
  nameLabel: string;
  rows: ReportProps["data"]["gamePerformance"];
  currency: Currency;
}) {
  return (
    <ReportPanel id={id} title={title} scope="Selected period" className="md:col-span-6">
      <Table scrollLabel={`${title} breakdown`}>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-panel">{nameLabel}</TableHead>
            <TableHead className="text-right">Sales</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="pr-panel text-right">Net profit</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell className="max-w-48 pl-panel font-medium wrap-anywhere">
                {row.name}
              </TableCell>
              <TableCell className="text-right tabular-nums">{row.sales.toString()}</TableCell>
              <TableCell className="text-right">
                <Money currency={currency} value={row.revenue} />
              </TableCell>
              <TableCell className="pr-panel text-right">
                <Money currency={currency} value={row.netProfit} colored />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ReportPanel>
  );
}
