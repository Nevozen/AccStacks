import { NextRequest } from "next/server";
import { csvMoney } from "@/lib/csv";
import { getAnalytics } from "@/services/analytics";
import { getSettings } from "@/services/settings";
import { overviewQuerySchema } from "@/schemas/overview";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { currency, timezone } = await getSettings(user.id);
  if (!currency)
    return Response.json({ error: "Choose your workspace currency first" }, { status: 409 });
  const params = request.nextUrl.searchParams;
  let analytics: Awaited<ReturnType<typeof getAnalytics>>;
  try {
    const query = overviewQuerySchema.parse({
      range: params.get("range") ?? "last30",
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
    });
    analytics = await getAnalytics(user.id, query, timezone);
  } catch {
    return Response.json({ error: "Invalid reporting period" }, { status: 400 });
  }
  const scope = `${analytics.range.fromInput || "Beginning"} to ${analytics.range.toInput || "Present"}`;
  const amount = (value: bigint | null) => (value === null ? "N/A" : csvMoney(value, currency));
  const rows = [
    ["Total Accounts", analytics.inventory.totalAccounts, "Current inventory"],
    ["Available Accounts", analytics.inventory.availableAccounts, "Current inventory"],
    ["Listed Accounts", analytics.inventory.listedAccounts, "Current inventory"],
    ["Sold Accounts", analytics.inventory.soldAccounts, "Current inventory"],
    ["Active Listings", analytics.inventory.activeListings, "Current inventory"],
    [
      `Inventory Value (${currency})`,
      amount(analytics.inventory.inventoryValue),
      "Current inventory",
    ],
    [
      `Estimated Unrealized Profit (${currency})`,
      amount(analytics.inventory.estimatedUnrealizedProfit),
      "Current estimate",
    ],
    ["Completed Sales", analytics.financial.completedSales, scope],
    [`Total Revenue (${currency})`, amount(analytics.financial.totalRevenue), scope],
    [`Cost of Goods Sold (${currency})`, amount(analytics.financial.costOfGoodsSold), scope],
    [
      `Total Additional Expenses (${currency})`,
      amount(analytics.financial.totalAdditionalExpenses),
      scope,
    ],
    [`Net Profit (${currency})`, amount(analytics.financial.netProfit), scope],
    ["Profit Margin (%)", analytics.financial.profitMargin ?? "N/A", scope],
    ["Return on Investment (%)", analytics.financial.returnOnInvestment ?? "N/A", scope],
    [
      `Average Profit per Sale (${currency})`,
      amount(analytics.financial.averageProfitPerSale),
      scope,
    ],
    [`Average Selling Price (${currency})`, amount(analytics.financial.averageSellingPrice), scope],
    [
      `Owner Capital (${currency})`,
      amount(analytics.capitalPosition.capital),
      "Capital and equity",
    ],
    [
      `Retained Net Profit (${currency})`,
      amount(analytics.capitalPosition.retainedNetProfit),
      "All time",
    ],
    [
      `Estimated Cash (${currency})`,
      amount(analytics.capitalPosition.estimatedCash),
      "Current estimate",
    ],
    [
      `Estimated Equity (${currency})`,
      amount(analytics.capitalPosition.estimatedEquity),
      "Current estimate",
    ],
  ] as const;
  return csvResponse("accstacks-financial-summary.csv", ["Metric", "Value", "Scope"], rows);
}
