"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCompactMoney } from "@/lib/money";
import type { SalesChartPoint } from "./sales-chart-data";

export function SalesChart({ points }: { points: SalesChartPoint[] }) {
  const ticks = { fill: "var(--muted-foreground)", fontSize: 11 };
  return (
    <div className="h-56 min-w-0 overflow-clip sm:h-[236px] [&_.recharts-surface]:focus-visible:-outline-offset-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          title="Revenue and net profit over time in Indonesian Rupiah"
          accessibilityLayer
          data={points}
          margin={{ top: 12, right: 10, bottom: 0, left: 0 }}
          barGap={2}
          maxBarSize={22}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
          <XAxis
            dataKey="label"
            tick={ticks}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
            tickMargin={8}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={ticks}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tickFormatter={(value: number) =>
              value < 0 ? `-${formatCompactMoney(-value)}` : formatCompactMoney(value)
            }
            width={72}
            tickCount={5}
            allowDecimals={false}
            domain={["auto", "auto"]}
          />
          <ReferenceLine y={0} ifOverflow="extendDomain" stroke="var(--input)" />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as SalesChartPoint | undefined;
              if (!active || !point) return null;
              return (
                <div
                  className="rounded-lg border bg-popover p-2.5 text-xs text-popover-foreground shadow-overlay"
                  role="status"
                >
                  <p className="font-semibold">{point.date}</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {point.sales} completed {point.sales === 1 ? "sale" : "sales"}
                  </p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 tabular-nums">
                    <dt>Revenue</dt>
                    <dd className="text-right">{point.revenueText}</dd>
                    <dt>Net profit</dt>
                    <dd className="text-right">{point.netProfitText}</dd>
                  </dl>
                </div>
              );
            }}
          />
          <Bar
            name="Revenue"
            dataKey="revenue"
            fill="var(--chart-1)"
            radius={2}
            isAnimationActive={false}
          />
          <Bar
            name="Net profit"
            dataKey="netProfit"
            fill="var(--chart-2)"
            radius={2}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
