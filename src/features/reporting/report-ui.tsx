import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Download, Ellipsis, Info, Minus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { loadReport } from "@/server/reporting";
import { reportHref, type ReportPeriod } from "./report-period";

export type ReportProps = Awaited<ReturnType<typeof loadReport>>;

export function ReportPanel({
  id,
  title,
  scope,
  description,
  action,
  className,
  children,
}: {
  id: string;
  title: string;
  scope?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card role="region" aria-labelledby={id} className={className}>
      <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 p-panel pb-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <h2 id={id} className="scroll-mt-18 text-[15px] font-semibold tracking-tight">
              {title}
            </h2>
            {scope ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {scope}
              </span>
            ) : null}
          </div>
          {description ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      {children}
    </Card>
  );
}

export function ReportLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-mr-1.5 text-accent-foreground">
      <Link href={href}>
        {children} <ArrowUpRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function MetricHelp({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="grid size-6 shrink-0 place-items-center rounded-sm"
          aria-label={label}
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

export function ReportActions({
  period,
  overview = false,
}: {
  period: ReportPeriod;
  overview?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {overview ? (
          <Button
            variant="outline"
            size="icon"
            className="size-10"
            aria-label="More overview actions"
          >
            <Ellipsis aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="outline">
            <Download aria-hidden="true" /> Export
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {overview ? (
          <>
            <DropdownMenuItem asChild>
              <Link href="/listings?create=1">
                <Store aria-hidden="true" /> Create Listing
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        ) : null}
        <DropdownMenuLabel>Export CSV</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={reportHref("/api/export/financial-summary", period)} download>
            Financial summary (selected period)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/api/export/sales" download>
            Completed sales (all time)
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type Comparison = ReportProps["data"]["comparison"];

export function PeriodChange({
  comparison,
  metric,
  className,
}: {
  comparison: Comparison;
  metric: "netProfit" | "revenue" | "sales";
  className?: string;
}) {
  if (!comparison.label) return null;
  const change = comparison[metric];
  if (!comparison.hasBaseline[metric] || !change.value) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>No prior-period baseline</p>
    );
  }
  const Icon =
    change.direction === "up" ? ArrowUpRight : change.direction === "down" ? ArrowDownRight : Minus;
  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 font-medium tabular-nums",
          change.direction === "up" && "bg-success/10 text-success",
          change.direction === "down" && "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
        {change.value}
      </span>
      {comparison.label}
    </p>
  );
}
