import { describe, expect, it } from "vitest";
import { formatMoney, formatPercentage, moneyToDto, toSafeNumber } from "@/lib/money";

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
});
