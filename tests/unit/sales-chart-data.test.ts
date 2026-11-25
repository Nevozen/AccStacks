import { describe, expect, it } from "vitest";
import { toSalesChartData } from "@/features/reporting/sales-chart-data";
import { resolveDateRange } from "@/lib/dates";

describe("sales chart data", () => {
  it("keeps the last partial month of a custom range and preserves signed Rupiah", () => {
    const timezone = "Asia/Jakarta";
    const range = resolveDateRange({
      range: "custom",
      from: "2025-01-31",
      to: "2025-04-02",
      timezone,
    });
    const result = toSalesChartData(
      {
        range,
        granularity: "month",
        trends: [
          { period: "2025-01", revenue: 800_000n, netProfit: 270_000n, sales: 1n },
          { period: "2025-04", revenue: 100_000n, netProfit: -125_000n, sales: 1n },
        ],
      },
      timezone,
    );

    expect(result.map(({ period, sales }) => [period, sales])).toEqual([
      ["2025-01", 1],
      ["2025-02", 0],
      ["2025-03", 0],
      ["2025-04", 1],
    ]);
    expect(result.at(-1)).toMatchObject({
      revenueText: "Rp100.000",
      netProfit: -125_000,
      netProfitText: "-Rp125.000",
    });
  });
});
