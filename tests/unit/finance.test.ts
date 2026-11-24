import { describe, expect, it } from "vitest";
import {
  calculateAverage,
  calculateListingMetrics,
  calculatePercentage,
  calculateSaleMetrics,
  calculateUnrealizedProfit,
  sumExpenses,
} from "@/lib/finance";

describe("financial calculations", () => {
  it("calculates the documented profitable sale", () => {
    expect(
      calculateSaleMetrics({
        purchasePrice: 500_000n,
        sellingPrice: 800_000n,
        expenses: [20_000n, 5_000n],
      }),
    ).toEqual({
      totalExpenses: 25_000n,
      netProfit: 275_000n,
      profitMargin: "34.38",
      roi: "55.00",
    });
  });

  it("allows losses and rounds away from zero at half values", () => {
    const result = calculateSaleMetrics({
      purchasePrice: 500_000n,
      sellingPrice: 400_000n,
      expenses: [25_000n],
    });
    expect(result.netProfit).toBe(-125_000n);
    expect(result.profitMargin).toBe("-31.25");
    expect(result.roi).toBe("-25.00");
    expect(calculatePercentage(-1n, 8n, 2)).toBe("-12.50");
  });

  it("returns N/A-compatible null ratios for zero denominators", () => {
    expect(calculatePercentage(100n, 0n)).toBeNull();
    expect(
      calculateSaleMetrics({ purchasePrice: 0n, sellingPrice: 0n, expenses: [] }),
    ).toMatchObject({ profitMargin: null, roi: null });
  });

  it("aggregates expenses and rejects negative expense amounts", () => {
    expect(sumExpenses([1n, 2n, 3n])).toBe(6n);
    expect(sumExpenses([])).toBe(0n);
    expect(() => sumExpenses([-1n])).toThrow("cannot be negative");
  });

  it("calculates listing estimates without confusing margin and ROI", () => {
    expect(calculateListingMetrics({ listingPrice: 850_000n, purchasePrice: 500_000n })).toEqual({
      estimatedProfit: 350_000n,
      estimatedProfitMargin: "41.18",
      estimatedRoi: "70.00",
    });
  });

  it("calculates rounded averages and handles empty datasets", () => {
    expect(calculateAverage(100n, 3)).toBe(33n);
    expect(calculateAverage(-100n, 3)).toBe(-33n);
    expect(calculateAverage(0n, 0)).toBeNull();
  });

  it("uses only the highest active asking price per account for unrealized profit", () => {
    expect(
      calculateUnrealizedProfit([
        { purchasePrice: 500_000n, activeListingPrices: [800_000n, 900_000n, 850_000n] },
        { purchasePrice: 300_000n, activeListingPrices: [250_000n] },
        { purchasePrice: 100_000n, activeListingPrices: [] },
      ]),
    ).toBe(350_000n);
  });
});
