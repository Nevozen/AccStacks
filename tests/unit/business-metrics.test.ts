import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { resolvePreviousDateRange } from "@/lib/dates";
import { calculateCapitalPosition, calculateChange } from "@/lib/finance";

const now = DateTime.fromISO("2026-11-24T12:00:00", { zone: "Asia/Jakarta" });

describe("business comparison metrics", () => {
  it("calculates signed percentage changes and no-prior-data states", () => {
    expect(calculateChange(800n, 500n)).toEqual({ value: "+60.00%", direction: "up" });
    expect(calculateChange(400n, 500n)).toEqual({ value: "-20.00%", direction: "down" });
    expect(calculateChange(500n, 500n)).toEqual({ value: "0.00%", direction: "steady" });
    expect(calculateChange(800n, 0n)).toEqual({ value: null, direction: "new" });
  });

  it("calculates capital, equity, and cash without treating inventory as profit", () => {
    expect(
      calculateCapitalPosition({
        capital: 1_000_000n,
        retainedNetProfit: 275_000n,
        inventoryValue: 300_000n,
      }),
    ).toEqual({ estimatedEquity: 1_275_000n, estimatedCash: 975_000n });
  });

  it("calculates immediately preceding reporting periods", () => {
    const previousWeek = resolvePreviousDateRange({ range: "last7", now });
    expect(previousWeek.from?.toISOString()).toBe("2026-11-10T17:00:00.000Z");
    expect(previousWeek.toExclusive?.toISOString()).toBe("2026-11-17T17:00:00.000Z");

    const previousMonth = resolvePreviousDateRange({ range: "thisMonth", now });
    expect(previousMonth.from?.toISOString()).toBe("2026-09-30T17:00:00.000Z");
    expect(previousMonth.toExclusive?.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(resolvePreviousDateRange({ range: "all", now }).label).toBeNull();
  });
});
