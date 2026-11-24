import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { calculateHoldingDays, dateInputToUtc, dateToInput, resolveDateRange } from "@/lib/dates";

const now = DateTime.fromISO("2026-11-24T15:30:00", { zone: "Asia/Jakarta" });

describe("date ranges", () => {
  it("uses inclusive Jakarta calendar days converted to UTC boundaries", () => {
    const result = resolveDateRange({ range: "last7", now });
    expect(result.fromInput).toBe("2026-11-18");
    expect(result.toInput).toBe("2026-11-24");
    expect(result.from?.toISOString()).toBe("2026-11-17T17:00:00.000Z");
    expect(result.toExclusive?.toISOString()).toBe("2026-11-24T17:00:00.000Z");
  });

  it("calculates last month independently of the current day", () => {
    const result = resolveDateRange({ range: "lastMonth", now });
    expect(result.fromInput).toBe("2026-10-01");
    expect(result.toInput).toBe("2026-10-31");
  });

  it("supports all time and validates custom ranges", () => {
    expect(resolveDateRange({ range: "all", now })).toMatchObject({
      from: null,
      toExclusive: null,
    });
    expect(() =>
      resolveDateRange({ range: "custom", from: "2026-11-24", to: "2026-11-01", now }),
    ).toThrow();
  });

  it("round-trips date-only inputs in the application timezone", () => {
    const date = dateInputToUtc("2026-01-01");
    expect(date.toISOString()).toBe("2025-12-31T17:00:00.000Z");
    expect(dateToInput(date)).toBe("2026-01-01");
  });

  it("calculates holding periods using calendar days", () => {
    expect(calculateHoldingDays(dateInputToUtc("2026-11-01"), dateInputToUtc("2026-11-24"))).toBe(
      23,
    );
  });
});
