import { describe, expect, it } from "vitest";
import { groupListings } from "@/features/listings/groups";
import type { ListingDto } from "@/features/listings/types";

function listing(accountId: string, listingCode: string): ListingDto {
  return {
    id: listingCode,
    listingCode,
    marketplace: `Marketplace ${listingCode}`,
    marketplaceNormalized: `marketplace-${listingCode}`,
    listingPrice: "800000",
    listingUrl: null,
    notes: null,
    listedAt: "2026-11-01T00:00:00.000Z",
    listedDateInput: "2026-11-01",
    daysListed: 1,
    estimatedProfit: "300000",
    estimatedProfitMargin: "37.50",
    estimatedRoi: "60.00",
    account: {
      id: accountId,
      accountCode: accountId,
      gameName: "Wuthering Waves",
      accountName: "Grouped Account",
      description: null,
      imageUrl: null,
      purchasePrice: "500000",
      purchaseDate: "2026-11-01T00:00:00.000Z",
      activeListingCount: 3,
      activeListings: [],
    },
  };
}

describe("listing account groups", () => {
  it("keeps multiple independent listings in one account group", () => {
    const groups = groupListings([
      listing("WW1", "WW1-1"),
      listing("WW1", "WW1-2"),
      listing("WW2", "WW2-1"),
      listing("WW1", "WW1-3"),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.listings.map((listing) => listing.listingCode)).toEqual([
      "WW1-1",
      "WW1-2",
      "WW1-3",
    ]);
    expect(groups[1]?.listings).toHaveLength(1);
  });
});
