import { calculateEstimatedProfit } from "@/lib/finance";
import { csvMoney } from "@/lib/csv";
import { formatIsoInTimezone } from "@/lib/dates";
import { getActiveListingsExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currency, timezone } = await getSettings(user.id);
  if (!currency)
    return Response.json({ error: "Choose your workspace currency first" }, { status: 409 });
  const listings = await getActiveListingsExport(user.id);
  return csvResponse(
    "accstacks-active-listings.csv",
    [
      "Listing ID",
      "Account ID",
      "Game",
      "Account Name",
      "Marketplace",
      `Purchase Price (${currency})`,
      `Listing Price (${currency})`,
      `Estimated Profit (${currency})`,
      "Listing Date",
      "Listing URL",
      "Status",
      "Notes",
    ],
    listings.map((listing) => [
      listing.listingCode,
      listing.account.accountCode,
      listing.account.gameName,
      listing.account.accountName,
      listing.marketplace,
      csvMoney(listing.account.purchasePrice, currency),
      csvMoney(listing.listingPrice, currency),
      csvMoney(
        calculateEstimatedProfit(listing.listingPrice, listing.account.purchasePrice),
        currency,
      ),
      formatIsoInTimezone(listing.listedAt, timezone),
      listing.listingUrl,
      listing.status,
      listing.notes,
    ]),
  );
}
