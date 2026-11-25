import Link from "next/link";
import { ArrowUpRight, Boxes, Wallet } from "lucide-react";
import { Money } from "@/components/shared/money";
import { Card } from "@/components/ui/card";
import { calculatePercentage } from "@/lib/finance";
import { formatPercentage } from "@/lib/money";
import { cn } from "@/lib/utils";
import { MetricHelp, PeriodChange, ReportLink, ReportPanel, type ReportProps } from "./report-ui";

type Data = ReportProps["data"];

export function FinancialPosition({
  capital,
  estimatedEquity,
  estimatedCash,
  retainedNetProfit,
  inventoryValue,
}: Data["capitalPosition"] & { inventoryValue: bigint }) {
  const allocation =
    estimatedCash > 0n && inventoryValue > 0n
      ? calculatePercentage(estimatedCash, estimatedCash + inventoryValue)
      : null;
  const details = [
    { label: "Estimated Cash", value: estimatedCash, swatch: allocation && "bg-primary" },
    { label: "Inventory Value", value: inventoryValue, swatch: allocation && "bg-equity-muted/65" },
    { label: "Owner Capital", value: capital },
    { label: "Retained Net Profit", value: retainedNetProfit },
  ];
  return (
    <Card
      role="region"
      aria-labelledby="financial-position"
      className="border-equity bg-equity p-panel text-equity-foreground md:col-span-7"
    >
      <header className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <h2
          id="financial-position"
          className="inline-flex items-center gap-2 text-[15px] font-semibold"
        >
          <Wallet className="size-4 text-primary" strokeWidth={1.75} aria-hidden="true" />
          Financial overview
        </h2>
        <Link
          href="/settings"
          className="inline-flex min-h-7 items-center gap-1 rounded-sm text-xs text-equity-muted hover:text-equity-foreground hover:underline focus-visible:outline-primary"
        >
          Manage capital <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </Link>
      </header>
      <dl className="mt-3 pb-3">
        <dt className="flex items-center gap-1 text-sm text-equity-muted">
          Estimated Equity
          <span className="[&_button]:focus-visible:outline-primary">
            <MetricHelp label="How estimated equity and cash are calculated">
              Equity is owner capital plus all-time retained net profit. Cash is estimated equity
              minus unsold inventory cost. Neither represents a recorded bank balance.
            </MetricHelp>
          </span>
        </dt>
        <dd className="mt-0.5 text-display font-semibold tracking-[-0.05em] wrap-anywhere">
          <Money
            value={estimatedEquity}
            className={cn("font-semibold", estimatedEquity < 0n && "text-equity-negative")}
          />
        </dd>
      </dl>
      {allocation ? (
        <div
          className="flex h-1.5 overflow-hidden rounded-full bg-equity-muted/65"
          aria-hidden="true"
        >
          <div className="rounded-full bg-primary" style={{ width: `${allocation}%` }} />
        </div>
      ) : (
        <div className="border-t border-equity-muted/25" />
      )}
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5 xl:grid-cols-4">
        {details.map(({ label, value, swatch }) => (
          <div key={label} className="min-w-0">
            <dt className="flex items-center gap-1.5 text-xs text-equity-muted">
              {swatch ? (
                <span className={cn("size-1.5 shrink-0 rounded-full", swatch)} aria-hidden="true" />
              ) : null}
              {label}
            </dt>
            <dd className="mt-0.5 text-sm wrap-anywhere">
              <Money
                value={value}
                className={cn("font-semibold", value < 0n && "text-equity-negative")}
              />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

export function ProfitOverview({ financial, comparison }: Pick<Data, "financial" | "comparison">) {
  return (
    <ReportPanel
      id="profit-overview"
      title="Profit overview"
      scope="Realized"
      className="flex flex-col md:col-span-5"
    >
      <div className="flex flex-1 flex-col px-panel pb-panel">
        <dl>
          <dt className="text-sm text-muted-foreground">Net Profit</dt>
          <dd className="mt-0.5 text-display font-semibold tracking-[-0.05em] wrap-anywhere">
            <Money value={financial.netProfit} colored className="font-semibold" />
          </dd>
        </dl>
        <PeriodChange comparison={comparison} metric="netProfit" className="mt-2" />
        <div className="mt-auto pt-3">
          <dl className="grid grid-cols-2 gap-3 border-t pt-3">
            <div>
              <dt className="text-xs text-muted-foreground">Total Revenue</dt>
              <dd className="mt-0.5 text-lg leading-tight tracking-tight wrap-anywhere">
                <Money value={financial.totalRevenue} className="font-semibold" />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Profit Margin</dt>
              <dd className="mt-0.5 text-lg leading-tight font-semibold tracking-tight tabular-nums">
                {formatPercentage(financial.profitMargin)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </ReportPanel>
  );
}

export function InventoryOverview({ inventory }: Pick<Data, "inventory">) {
  const hasAccounts = inventory.totalAccounts > 0;
  const statuses = [
    {
      color: "bg-chart-2",
      label: "Available",
      key: "available",
      count: inventory.availableAccounts,
    },
    {
      color: "bg-chart-1",
      label: "Listed",
      key: "listed",
      count: inventory.listedAccounts,
    },
    { color: "bg-chart-3", label: "Sold", key: "sold", count: inventory.soldAccounts },
  ];
  return (
    <ReportPanel
      id="inventory-overview"
      title="Inventory overview"
      scope="Current"
      className="flex flex-col md:col-span-5"
      action={<ReportLink href="/stocks">Stocks</ReportLink>}
    >
      <div className="flex flex-1 flex-col px-panel pb-panel">
        <dl className="flex items-baseline gap-2">
          <dt className="order-2 text-xs text-muted-foreground">Total Accounts</dt>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">
            {inventory.totalAccounts}
          </dd>
        </dl>
        {hasAccounts ? (
          <div className="mt-2 flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden="true">
            {statuses
              .filter(({ count }) => count > 0)
              .map(({ key, color, count }) => (
                <span key={key} className={color} style={{ flex: count }} />
              ))}
          </div>
        ) : null}
        <ul className={cn("mt-2", hasAccounts ? "space-y-0.5" : "grid grid-cols-3 gap-2")}>
          {statuses.map(({ color, label, key, count }) => (
            <li key={key}>
              <Link
                href={`/stocks?category=${key}`}
                className={cn(
                  "flex rounded-sm hover:bg-muted",
                  hasAccounts
                    ? "-mx-1.5 min-h-8 items-center gap-2 px-1.5 text-sm"
                    : "min-h-10 flex-col justify-center rounded-md bg-muted/55 px-2 py-1 text-xs text-muted-foreground",
                )}
              >
                {hasAccounts ? (
                  <span className={cn("size-2 shrink-0 rounded-sm", color)} aria-hidden="true" />
                ) : null}
                <span>
                  {label}
                  <span className={cn(!hasAccounts && "sr-only")}> Accounts</span>
                </span>
                <span
                  className={cn(
                    "font-medium tabular-nums",
                    hasAccounts ? "ml-auto" : "text-foreground",
                  )}
                >
                  {count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-center justify-between gap-x-2 border-t pt-2">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Boxes className="size-3.5" aria-hidden="true" />
              <span className="font-medium tabular-nums">{inventory.activeListings}</span> Active
              Listings
            </p>
            <ReportLink href="/listings">Listings</ReportLink>
          </div>
          {!hasAccounts ? (
            <p className="mt-1 text-xs text-muted-foreground">
              No accounts yet. Add your first account to start tracking inventory.
            </p>
          ) : null}
        </div>
      </div>
    </ReportPanel>
  );
}
