import { describe, expect, it } from "vitest";
import {
  formatCompactMoney,
  formatMoney,
  formatPercentage,
  moneyToDecimal,
  moneyToDto,
  parseMoneyInput,
  toSafeNumber,
} from "@/lib/money";

describe("money formatting", () => {
  it.each([
    [50_000n, "Rp50.000"],
    [500_000n, "Rp500.000"],
    [1_500_000n, "Rp1.500.000"],
    [-25_000n, "-Rp25.000"],
  ])("formats %s as %s", (value, expected) => {
    expect(formatMoney(value)).toBe(expected);
  });

  it("serializes BigInt values without JSON precision loss", () => {
    expect(moneyToDto(9_007_199_254_740_991n)).toBe("9007199254740991");
    expect(toSafeNumber(500_000n)).toBe(500_000);
    expect(() => toSafeNumber(9_007_199_254_740_992n)).toThrow(RangeError);
  });

  it("formats unavailable ratios as N/A", () => {
    expect(formatPercentage(null)).toBe("N/A");
    expect(formatPercentage("55.00")).toBe("55.00%");
  });

  it("round-trips USD cents without floating-point conversion", () => {
    expect(parseMoneyInput("19.9", "USD")).toBe(1_990n);
    expect(parseMoneyInput("19", "USD")).toBe(1_900n);
    expect(parseMoneyInput("90071992547409.91", "USD")).toBe(9_007_199_254_740_991n);
    expect(parseMoneyInput("90071992547409.92", "USD")).toBeNull();
    expect(moneyToDecimal(-9_007_199_254_740_991n, "USD")).toBe("-90071992547409.91");
    expect(formatMoney(9_007_199_254_740_991n, "USD")).toBe("$90,071,992,547,409.91");
    expect(formatMoney(-36n, "USD")).toBe("-$0.36");
    expect(formatCompactMoney(-36, "USD")).toBe("-$0.36");
  });

  it("rejects invalid money instead of silently rounding or changing currency", () => {
    expect(parseMoneyInput("10.20", "IDR")).toBeNull();
    expect(parseMoneyInput("10.201", "USD")).toBeNull();
    expect(parseMoneyInput("1e3", "USD")).toBeNull();
    expect(parseMoneyInput("-0.10", "USD")).toBeNull();
  });
});
