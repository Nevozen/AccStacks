import { deriveAccountStatus } from "@/lib/account-status";
import { csvMoney } from "@/lib/csv";
import { formatIsoInTimezone } from "@/lib/dates";
import { getInventoryExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currency, timezone } = await getSettings(user.id);
  if (!currency)
    return Response.json({ error: "Choose your workspace currency first" }, { status: 409 });
  const accounts = await getInventoryExport(user.id);
  return csvResponse(
    "accstacks-inventory.csv",
    [
      "Account ID",
      "Game",
      "Account Name",
      "Description",
      "Image URL",
      `Purchase Price (${currency})`,
      "Purchase Date",
      "Purchased From",
      "Status",
      "Active Listings",
      "Sale Date",
      "Internal Notes",
    ],
    accounts.map((account) => [
      account.accountCode,
      account.gameName,
      account.accountName,
      account.description,
      account.imageUrl,
      csvMoney(account.purchasePrice, currency),
      formatIsoInTimezone(account.purchaseDate, timezone),
      account.purchasedFrom,
      deriveAccountStatus({
        sold: Boolean(account.sale),
        activeListingCount: account._count.listings,
      }),
      account._count.listings,
      account.sale ? formatIsoInTimezone(account.sale.soldAt, timezone) : "",
      account.notes,
    ]),
  );
}
