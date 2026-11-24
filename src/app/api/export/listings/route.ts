import { calculateEstimatedProfit } from "@/lib/finance";
import { formatIsoInTimezone } from "@/lib/dates";
import { getActiveListingsExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

const headers = [
  "Listing ID",
  "Account ID",
  "Game",
  "Account Name",
  "Marketplace",
  "Purchase Price (IDR)",
  "Listing Price (IDR)",
  "Estimated Profit (IDR)",
  "Listing Date",
  "Listing URL",
  "Status",
  "Notes",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [listings, settings] = await Promise.all([
    getActiveListingsExport(user.id),
    getSettings(user.id),
  ]);
  return csvResponse(
    "accstacks-active-listings.csv",
    headers,
    listings.map((listing) => [
      listing.id,
      listing.account.id,
      listing.account.gameName,
      listing.account.accountName,
      listing.marketplace,
      listing.account.purchasePrice,
      listing.listingPrice,
      calculateEstimatedProfit(listing.listingPrice, listing.account.purchasePrice),
      formatIsoInTimezone(listing.listedAt, settings.timezone),
      listing.listingUrl,
      listing.status,
      listing.notes,
    ]),
  );
}
