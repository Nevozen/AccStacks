import { formatIsoInTimezone } from "@/lib/dates";
import { calculatePercentage } from "@/lib/finance";
import { getCompletedSalesExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

const headers = [
  "Sale ID",
  "Account ID",
  "Game",
  "Account Name",
  "Marketplace",
  "Purchase Price Snapshot (IDR)",
  "Original Listing Price (IDR)",
  "Actual Selling Price (IDR)",
  "Total Expenses (IDR)",
  "Net Profit (IDR)",
  "Profit Margin (%)",
  "ROI (%)",
  "Sale Date",
  "Expense Breakdown",
  "Transaction Notes",
];

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [sales, settings] = await Promise.all([
    getCompletedSalesExport(user.id),
    getSettings(user.id),
  ]);
  return csvResponse(
    "accstacks-completed-sales.csv",
    headers,
    sales.map((sale) => [
      sale.id,
      sale.account.accountCode,
      sale.account.gameName,
      sale.account.accountName,
      sale.marketplace,
      sale.purchasePrice,
      sale.originalListingPrice,
      sale.sellingPrice,
      sale.totalExpenses,
      sale.netProfit,
      calculatePercentage(sale.netProfit, sale.sellingPrice) ?? "N/A",
      calculatePercentage(sale.netProfit, sale.purchasePrice) ?? "N/A",
      formatIsoInTimezone(sale.soldAt, settings.timezone),
      sale.expenses.map((expense) => `${expense.name}: ${expense.amount}`).join(" | "),
      sale.notes,
    ]),
  );
}
