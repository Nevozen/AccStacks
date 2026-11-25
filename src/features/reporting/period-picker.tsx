"use client";

import { useId, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DATE_RANGES } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { formatReportPeriod, periodLabels, reportHref, type ReportPeriod } from "./report-period";

export function PeriodPicker({ period }: { period: ReportPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function changeOpen(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setCustom(period.range === "custom");
      setError("");
    }
  }

  function apply(next: ReportPeriod) {
    setOpen(false);
    startTransition(() => router.replace(reportHref(pathname, next), { scroll: false }));
  }

  return (
    <Popover open={open} onOpenChange={changeOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Reporting period: ${periodLabels[period.range]}`}
          aria-busy={pending}
        >
          <CalendarDays className="text-muted-foreground" aria-hidden="true" />
          {periodLabels[period.range]}
          <ChevronDown className="text-muted-foreground" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        className="w-80"
        aria-label="Reporting period"
      >
        <p className="px-2 text-sm font-semibold">Reporting period</p>
        <p className="mt-0.5 px-2 text-xs text-muted-foreground">{formatReportPeriod(period)}</p>
        <div className="mt-2 grid grid-cols-2 gap-1">
          {DATE_RANGES.filter((range) => range !== "custom").map((range) => (
            <Button
              key={range}
              size="sm"
              variant="ghost"
              aria-pressed={period.range === range}
              className={cn(
                "justify-between",
                period.range === range && "bg-accent text-accent-foreground",
              )}
              onClick={() => apply({ ...period, range })}
            >
              {periodLabels[range]}
              {period.range === range ? <Check aria-hidden="true" /> : null}
            </Button>
          ))}
        </div>
        <div className="mt-2 border-t pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between"
            aria-expanded={custom}
            onClick={() => setCustom(!custom)}
          >
            Custom range
            <ChevronDown className={cn(custom && "rotate-180")} aria-hidden="true" />
          </Button>
          {custom ? (
            <form
              className="mt-2 space-y-2 px-1"
              onSubmit={(event) => {
                event.preventDefault();
                const fields = new FormData(event.currentTarget);
                const from = String(fields.get("from"));
                const to = String(fields.get("to"));
                if (from > to) {
                  setError("End date must be on or after the start date.");
                  return;
                }
                apply({ range: "custom", from, to });
              }}
              onChange={() => error && setError("")}
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0 space-y-1">
                  <Label htmlFor={`${id}-from`}>Start date</Label>
                  <Input
                    id={`${id}-from`}
                    type="date"
                    name="from"
                    defaultValue={period.from}
                    required
                  />
                </div>
                <div className="min-w-0 space-y-1">
                  <Label htmlFor={`${id}-to`}>End date</Label>
                  <Input id={`${id}-to`} type="date" name="to" defaultValue={period.to} required />
                </div>
              </div>
              {error ? (
                <p role="alert" className="text-xs text-destructive">
                  {error}
                </p>
              ) : null}
              <Button type="submit" size="sm" className="w-full">
                Apply dates
              </Button>
            </form>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
