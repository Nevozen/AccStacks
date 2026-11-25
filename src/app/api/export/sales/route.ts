import { formatIsoInTimezone } from "@/lib/dates";
import { csvMoney } from "@/lib/csv";
import { calculatePercentage } from "@/lib/finance";
import { moneyToDecimal } from "@/lib/money";
import { getCompletedSalesExport } from "@/services/exports";
import { getSettings } from "@/services/settings";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currency, timezone } = await getSettings(user.id);
  if (!currency)
    return Response.json({ error: "Choose your workspace currency first" }, { status: 409 });
  const sales = await getCompletedSalesExport(user.id);
  return csvResponse(
    "accstacks-completed-sales.csv",
    [
      "Sale ID",
      "Account ID",
      "Game",
      "Account Name",
      "Marketplace",
      `Purchase Price Snapshot (${currency})`,
      `Original Listing Price (${currency})`,
      `Actual Selling Price (${currency})`,
      `Total Expenses (${currency})`,
      `Net Profit (${currency})`,
      "Profit Margin (%)",
      "ROI (%)",
      "Sale Date",
      "Expense Breakdown",
      "Transaction Notes",
    ],
    sales.map((sale) => [
      sale.id,
      sale.account.accountCode,
      sale.account.gameName,
      sale.account.accountName,
      sale.marketplace,
      csvMoney(sale.purchasePrice, currency),
      csvMoney(sale.originalListingPrice, currency),
      csvMoney(sale.sellingPrice, currency),
      csvMoney(sale.totalExpenses, currency),
      csvMoney(sale.netProfit, currency),
      calculatePercentage(sale.netProfit, sale.sellingPrice) ?? "N/A",
      calculatePercentage(sale.netProfit, sale.purchasePrice) ?? "N/A",
      formatIsoInTimezone(sale.soldAt, timezone),
      sale.expenses
        .map((expense) => `${expense.name}: ${moneyToDecimal(expense.amount, currency)}`)
        .join(" | "),
      sale.notes,
    ]),
  );
}
