import type { ListingDto, ListingGroupDto } from "./types";

export function groupListings(listings: readonly ListingDto[]): ListingGroupDto[] {
  const groups = new Map<string, ListingGroupDto>();
  for (const listing of listings) {
    const existing = groups.get(listing.account.id);
    if (existing) existing.listings.push(listing);
    else groups.set(listing.account.id, { account: listing.account, listings: [listing] });
  }
  return [...groups.values()];
}
