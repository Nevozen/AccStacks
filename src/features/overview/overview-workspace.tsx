"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarRange,
  CircleDollarSign,
  Download,
  Package,
  Plus,
  ReceiptText,
  Store,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/dates";
import { formatPercentage } from "@/lib/money";
import {
  HoldingPeriodChart,
  InventoryStatusChart,
  MonthlySalesChart,
  PerformanceChart,
  RevenueProfitChart,
} from "./analytics-charts";
import type { ChangeDto, OverviewDto } from "./types";

const ranges = [
  ["last7", "Last 7 days"],
  ["last30", "Last 30 days"],
  ["thisMonth", "This month"],
  ["lastMonth", "Last month"],
  ["thisYear", "This year"],
  ["all", "All time"],
  ["custom", "Custom range"],
] as const;

export function OverviewWorkspace({ data, timezone }: { data: OverviewDto; timezone: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function navigate(values: Record<string, string | null>) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const inventoryMetrics = [
    { label: "Total Accounts", value: String(data.inventory.totalAccounts), icon: Package },
    { label: "Available Accounts", value: String(data.inventory.availableAccounts), icon: Package },
    { label: "Listed Accounts", value: String(data.inventory.listedAccounts), icon: Store },
    { label: "Sold Accounts", value: String(data.inventory.soldAccounts), icon: ReceiptText },
    { label: "Active Listings", value: String(data.inventory.activeListings), icon: Store },
    {
      label: "Inventory Value",
      value: <Money value={BigInt(data.inventory.inventoryValue)} />,
      icon: CircleDollarSign,
    },
  ];
  const financialMetrics = [
    {
      label: "Total Revenue",
      value: <Money value={BigInt(data.financial.totalRevenue)} />,
      change: data.comparison.revenue,
    },
    {
      label: "Cost of Goods Sold",
      value: <Money value={BigInt(data.financial.costOfGoodsSold)} />,
    },
    {
      label: "Additional Expenses",
      value: <Money value={BigInt(data.financial.totalAdditionalExpenses)} />,
    },
    {
      label: "Net Profit",
      value: <Money value={BigInt(data.financial.netProfit)} colored />,
      change: data.comparison.netProfit,
    },
    { label: "Profit Margin", value: formatPercentage(data.financial.profitMargin) },
    { label: "Return on Investment", value: formatPercentage(data.financial.returnOnInvestment) },
    {
      label: "Average Profit / Sale",
      value:
        data.financial.averageProfitPerSale === null ? (
          "N/A"
        ) : (
          <Money value={BigInt(data.financial.averageProfitPerSale)} colored />
        ),
    },
    {
      label: "Average Selling Price",
      value:
        data.financial.averageSellingPrice === null ? (
          "N/A"
        ) : (
          <Money value={BigInt(data.financial.averageSellingPrice)} />
        ),
    },
    {
      label: "Estimated Unrealized Profit",
      value: <Money value={BigInt(data.inventory.estimatedUnrealizedProfit)} colored />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Business performance, current inventory, and completed sales from your actual records."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/listings?create=1">
                <Store />
                Create Listing
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <a href="/api/export/sales" download>
                    Completed sales CSV
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a
                    href={`/api/export/financial-summary?${new URLSearchParams({ range: data.query.range, ...(data.query.range === "custom" ? { from: data.query.from, to: data.query.to } : {}) })}`}
                    download
                  >
                    Financial summary CSV
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button asChild>
              <Link href="/stocks?add=1">
                <Plus />
                Add Account
              </Link>
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 sm:flex-row sm:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium" htmlFor="overview-range">
            Reporting period
          </label>
          <Select
            value={data.query.range}
            onValueChange={(range) => navigate({ range: range === "last30" ? null : range })}
          >
            <SelectTrigger className="sm:w-48" id="overview-range">
              <CalendarRange className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ranges.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {data.query.range === "custom" ? (
          <form
            className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              navigate({
                range: "custom",
                from: String(form.get("from")),
                to: String(form.get("to")),
              });
            }}
          >
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="overview-from">
                From
              </label>
              <Input
                id="overview-from"
                name="from"
                type="date"
                defaultValue={data.query.from}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" htmlFor="overview-to">
                To
              </label>
              <Input id="overview-to" name="to" type="date" defaultValue={data.query.to} required />
            </div>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        ) : (
          <p className="pb-2 text-xs text-muted-foreground">
            Sales metrics are filtered; current inventory is not.
          </p>
        )}
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Capital and equity</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <MetricCard
            label="Owner Capital"
            value={<Money value={BigInt(data.capitalPosition.capital)} />}
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Retained Net Profit"
            value={<Money value={BigInt(data.capitalPosition.retainedNetProfit)} colored />}
            icon={TrendingUp}
          />
          <MetricCard
            label="Estimated Cash"
            value={<Money value={BigInt(data.capitalPosition.estimatedCash)} colored />}
            icon={CircleDollarSign}
          />
          <MetricCard
            label="Estimated Equity"
            value={<Money value={BigInt(data.capitalPosition.estimatedEquity)} colored />}
            icon={TrendingUp}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Current inventory</h2>
          <p className="text-xs text-muted-foreground">
            Always reflects the latest stock and active-listing state.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
          {inventoryMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Sales performance</h2>
          <p className="text-xs text-muted-foreground">
            {data.financial.completedSales} completed sale
            {data.financial.completedSales === 1 ? "" : "s"} in this period
            {data.comparison.label ? (
              <>
                {" "}
                · <ChangeIndicator change={data.comparison.sales} label={data.comparison.label} />
              </>
            ) : null}
            . Unrealized profit is a current estimate using the highest active asking price per
            account, not actual revenue.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-5">
          {financialMetrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} comparisonLabel={data.comparison.label} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 2xl:grid-cols-2">
        <RevenueProfitChart data={data.trends} />
        <MonthlySalesChart data={data.monthlySales} />
        <InventoryStatusChart
          data={[
            { name: "Available", value: data.inventory.availableAccounts },
            { name: "Listed", value: data.inventory.listedAccounts },
            { name: "Sold", value: data.inventory.soldAccounts },
          ]}
        />
        <PerformanceChart
          data={data.gamePerformance}
          type="netProfit"
          title="Most profitable games"
          description="Net profit and completed sales by game."
        />
        <PerformanceChart
          data={data.marketplacePerformance}
          type="revenue"
          title="Top marketplaces by revenue"
          description="Revenue and completed sales by sale marketplace."
        />
        <HoldingPeriodChart data={data.holdingPeriod} />
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold">Recent sales transactions</h2>
          <p className="text-xs text-muted-foreground">
            Latest completed sales within the selected reporting period.
          </p>
        </div>
        {data.recentSales.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No sales in this period"
            description="Completed sales and their actual financial results will appear here."
          />
        ) : (
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead className="text-right">Purchase</TableHead>
                  <TableHead className="text-right">Selling price</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Net profit</TableHead>
                  <TableHead>Sale date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Link
                        className="font-medium hover:underline"
                        href={`/stocks?category=sold&account=${sale.accountId}`}
                      >
                        {sale.accountName}
                      </Link>
                    </TableCell>
                    <TableCell>{sale.gameName}</TableCell>
                    <TableCell>{sale.marketplace}</TableCell>
                    <TableCell className="text-right">
                      <Money value={BigInt(sale.purchasePrice)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={BigInt(sale.sellingPrice)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={BigInt(sale.totalExpenses)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Money value={BigInt(sale.netProfit)} colored />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(new Date(sale.soldAt), timezone)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon = TrendingUp,
  change,
  comparisonLabel,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  change?: ChangeDto;
  comparisonLabel?: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div
          className="truncate text-lg font-semibold tabular-nums"
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </div>
        {change ? <ChangeIndicator change={change} label={comparisonLabel ?? null} /> : null}
      </CardContent>
    </Card>
  );
}

function ChangeIndicator({ change, label }: { change: ChangeDto; label: string | null }) {
  if (!label) return null;
  if (change.direction === "new") {
    return <span className="mt-1 block text-[10px] font-medium text-info">New {label}</span>;
  }
  const className =
    change.direction === "up"
      ? "mt-1 block text-[10px] font-medium text-success"
      : change.direction === "down"
        ? "mt-1 block text-[10px] font-medium text-destructive"
        : "mt-1 block text-[10px] text-muted-foreground";
  return (
    <span className={className}>
      {change.value} {label}
    </span>
  );
}
