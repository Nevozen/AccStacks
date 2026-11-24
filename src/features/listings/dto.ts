import type { getEligibleAccounts, ListingRecord } from "@/services/listings";
import { calculateHoldingDays, dateToInput } from "@/lib/dates";
import { calculateListingMetrics } from "@/lib/finance";
import type { EligibleAccountDto, ListingDto } from "./types";

export function toEligibleAccountDto(
  account: Awaited<ReturnType<typeof getEligibleAccounts>>[number],
): EligibleAccountDto {
  return {
    id: account.id,
    accountCode: account.accountCode,
    gameName: account.gameName,
    accountName: account.accountName,
    imageUrl: account.imageUrl,
    purchasePrice: account.purchasePrice.toString(),
    activeListings: account.listings.map((listing) => ({
      id: listing.id,
      listingCode: listing.listingCode,
      marketplace: listing.marketplace,
      marketplaceNormalized: listing.marketplaceNormalized,
      listingPrice: listing.listingPrice.toString(),
    })),
  };
}

export function toListingDto(
  listing: ListingRecord,
  timezone: string,
  now = new Date(),
): ListingDto {
  const metrics = calculateListingMetrics({
    listingPrice: listing.listingPrice,
    purchasePrice: listing.account.purchasePrice,
  });
  return {
    id: listing.id,
    listingCode: listing.listingCode,
    marketplace: listing.marketplace,
    marketplaceNormalized: listing.marketplaceNormalized,
    listingPrice: listing.listingPrice.toString(),
    listingUrl: listing.listingUrl,
    notes: listing.notes,
    listedAt: listing.listedAt.toISOString(),
    listedDateInput: dateToInput(listing.listedAt, timezone),
    daysListed: calculateHoldingDays(listing.listedAt, now, timezone),
    estimatedProfit: metrics.estimatedProfit.toString(),
    estimatedProfitMargin: metrics.estimatedProfitMargin,
    estimatedRoi: metrics.estimatedRoi,
    account: {
      id: listing.account.id,
      accountCode: listing.account.accountCode,
      gameName: listing.account.gameName,
      accountName: listing.account.accountName,
      description: listing.account.description,
      imageUrl: listing.account.imageUrl,
      purchasePrice: listing.account.purchasePrice.toString(),
      purchaseDate: listing.account.purchaseDate.toISOString(),
      activeListingCount: listing.account._count.listings,
      activeListings: [],
    },
  };
}
