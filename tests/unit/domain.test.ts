import { describe, expect, it } from "vitest";
import { deriveAccountStatus } from "@/lib/account-status";
import { normalizeCategory, normalizeName } from "@/lib/normalization";

describe("account status", () => {
  it("prioritizes completed sales over listing history", () => {
    expect(deriveAccountStatus({ sold: true, activeListingCount: 2 })).toBe("SOLD");
  });

  it("derives listed and available states from active listings", () => {
    expect(deriveAccountStatus({ sold: false, activeListingCount: 1 })).toBe("LISTED");
    expect(deriveAccountStatus({ sold: false, activeListingCount: 0 })).toBe("AVAILABLE");
  });
});

describe("category normalization", () => {
  it("trims and collapses whitespace while preserving display capitalization", () => {
    expect(normalizeName("  Mobile   Legends  ")).toBe("Mobile Legends");
  });

  it("normalizes marketplace analytics categories", () => {
    expect(normalizeCategory("  InStAgRam   Shop ")).toBe("instagram shop");
  });
});
