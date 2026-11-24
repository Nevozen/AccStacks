"use client";

import { ChartNoAxesColumn } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactMoney, formatMoney } from "@/lib/money";
import type { ChartPoint, PerformancePoint } from "./types";

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];
const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
};

export function RevenueProfitChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Revenue and net profit"
      description="Completed sales over the selected period."
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
          <YAxis
            tickFormatter={(value: number) => formatCompactMoney(value)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={72}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatMoney(Number(value)),
              name === "revenue" ? "Revenue" : "Net profit",
            ]}
          />
          <Legend formatter={(value) => (value === "revenue" ? "Revenue" : "Net profit")} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.12}
            strokeWidth={2}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="netProfit"
            stroke={colors[1]}
            fill={colors[1]}
            fillOpacity={0.1}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function MonthlySalesChart({ data }: { data: ChartPoint[] }) {
  return (
    <ChartCard
      title="Monthly sales performance"
      description="Revenue, profit, and completed sale count by month."
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            tickFormatter={(value: number) => formatCompactMoney(value)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={72}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [
              formatMoney(Number(value)),
              name === "revenue" ? "Revenue" : "Net profit",
            ]}
            labelFormatter={(label, payload) =>
              `${label} · ${payload[0]?.payload.sales ?? 0} sales`
            }
          />
          <Legend formatter={(value) => (value === "revenue" ? "Revenue" : "Net profit")} />
          <Bar dataKey="revenue" fill={colors[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar
            dataKey="netProfit"
            fill={colors[1]}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function InventoryStatusChart({ data }: { data: { name: string; value: number }[] }) {
  const empty = data.every((item) => item.value === 0);
  return (
    <ChartCard
      title="Inventory status"
      description="Current non-deleted account distribution."
      empty={empty}
    >
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
            isAnimationActive={false}
          >
            {data.map((item, index) => (
              <Cell key={item.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} accounts`, "Count"]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function PerformanceChart({
  data,
  type,
  title,
  description,
}: {
  data: PerformancePoint[];
  type: "netProfit" | "revenue";
  title: string;
  description: string;
}) {
  return (
    <ChartCard title={title} description={description} empty={data.length === 0}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={(value: number) => formatCompactMoney(value)}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={110}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [
              formatMoney(Number(value)),
              type === "revenue" ? "Revenue" : "Net profit",
            ]}
            labelFormatter={(label, payload) =>
              `${label} · ${payload[0]?.payload.sales ?? 0} sales`
            }
          />
          <Bar
            dataKey={type}
            fill={type === "revenue" ? colors[0] : colors[1]}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function HoldingPeriodChart({ data }: { data: { name: string; averageDays: number }[] }) {
  return (
    <ChartCard
      title="Inventory holding period"
      description="Average unsold account age by game in days."
      empty={data.length === 0}
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" unit="d" tickLine={false} axisLine={false} fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={11}
            width={110}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [`${value} days`, "Average holding period"]}
          />
          <Bar
            dataKey="averageDays"
            fill={colors[2]}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ChartCard({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {empty ? (
          <div className="flex h-[280px] flex-col items-center justify-center text-center">
            <ChartNoAxesColumn className="mb-2 size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No data for this view</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Try a different period or record a transaction first.
            </p>
          </div>
        ) : (
          <div role="img" aria-label={title}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
