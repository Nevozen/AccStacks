import type { Metadata } from "next";
import { ListingsWorkspace } from "@/features/listings/listings-workspace";
import { toEligibleAccountDto, toListingDto } from "@/features/listings/dto";
import { DEFAULT_MARKETPLACES } from "@/lib/normalization";
import { listingQuerySchema } from "@/schemas/listing";
import { getAccountGames } from "@/services/accounts";
import { getEligibleAccounts, getListingsData, getMarketplaces } from "@/services/listings";
import { getWorkspace } from "@/server/workspace";

export const metadata: Metadata = { title: "Listings" };

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { user, settings } = await getWorkspace();
  if (!settings.currency) return null;
  const params = await searchParams;
  const query = listingQuerySchema.parse({
    q: first(params.q),
    game: first(params.game),
    marketplace: first(params.marketplace),
    sort: first(params.sort),
    page: first(params.page),
  });
  const initialAccountId = first(params.account);
  const [data, games, marketplaces, eligibleAccounts, initialAccountRecords] = await Promise.all([
    getListingsData(user.id, query),
    getAccountGames(user.id),
    getMarketplaces(user.id),
    getEligibleAccounts(user.id),
    initialAccountId ? getEligibleAccounts(user.id, initialAccountId) : Promise.resolve([]),
  ]);
  const initialAccountRecord = initialAccountRecords.find(
    (account) => account.id === initialAccountId,
  );
  const now = new Date();
  const marketplaceSuggestions = [...DEFAULT_MARKETPLACES, ...marketplaces].filter(
    (marketplace, index, all) =>
      all.findIndex((item) => item.toLowerCase() === marketplace.toLowerCase()) === index,
  );

  return (
    <ListingsWorkspace
      listings={data.listings.map((listing) => toListingDto(listing, settings.timezone, now))}
      totalActiveListings={data.totalActiveListings}
      uniqueListedAccounts={data.uniqueListedAccounts}
      totalFiltered={data.totalFiltered}
      page={data.page}
      totalPages={data.totalPages}
      query={{ q: query.q, game: query.game, marketplace: query.marketplace, sort: query.sort }}
      games={games}
      marketplaces={marketplaces}
      marketplaceSuggestions={marketplaceSuggestions}
      eligibleAccounts={eligibleAccounts.map(toEligibleAccountDto)}
      initialAccount={initialAccountRecord ? toEligibleAccountDto(initialAccountRecord) : null}
      initialCreateOpen={first(params.create) === "1"}
      timezone={settings.timezone}
      currency={settings.currency}
    />
  );
}
