import { deriveAccountStatus } from "@/lib/account-status";
import { formatIsoInTimezone } from "@/lib/dates";
import { getInventoryExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

const headers = [
  "Account ID",
  "Game",
  "Account Name",
  "Description",
  "Image URL",
  "Purchase Price (IDR)",
  "Purchase Date",
  "Purchased From",
  "Status",
  "Active Listings",
  "Sale Date",
  "Internal Notes",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [accounts, settings] = await Promise.all([
    getInventoryExport(user.id),
    getSettings(user.id),
  ]);
  return csvResponse(
    "accstacks-inventory.csv",
    headers,
    accounts.map((account) => [
      account.accountCode,
      account.gameName,
      account.accountName,
      account.description,
      account.imageUrl,
      account.purchasePrice,
      formatIsoInTimezone(account.purchaseDate, settings.timezone),
      account.purchasedFrom,
      deriveAccountStatus({
        sold: Boolean(account.sale),
        activeListingCount: account._count.listings,
      }),
      account._count.listings,
      account.sale ? formatIsoInTimezone(account.sale.soldAt, settings.timezone) : "",
      account.notes,
    ]),
  );
}
