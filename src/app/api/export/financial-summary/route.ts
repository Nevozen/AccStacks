import { NextRequest } from "next/server";
import { getAnalytics } from "@/services/analytics";
import { getSettings } from "@/services/settings";
import { overviewQuerySchema } from "@/schemas/overview";
import { csvResponse } from "@/server/csv-response";
import { getSessionUser } from "@/server/session";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await getSettings(user.id);
  const params = request.nextUrl.searchParams;
  let analytics: Awaited<ReturnType<typeof getAnalytics>>;
  try {
    const query = overviewQuerySchema.parse({
      range: params.get("range") ?? "last30",
      from: params.get("from") ?? undefined,
      to: params.get("to") ?? undefined,
    });
    analytics = await getAnalytics(user.id, query, settings.timezone);
  } catch {
    return Response.json({ error: "Invalid reporting period" }, { status: 400 });
  }
  const scope = `${analytics.range.fromInput || "Beginning"} to ${analytics.range.toInput || "Present"}`;
  const rows = [
    ["Total Accounts", analytics.inventory.totalAccounts, "Current inventory"],
    ["Available Accounts", analytics.inventory.availableAccounts, "Current inventory"],
    ["Listed Accounts", analytics.inventory.listedAccounts, "Current inventory"],
    ["Sold Accounts", analytics.inventory.soldAccounts, "Current inventory"],
    ["Active Listings", analytics.inventory.activeListings, "Current inventory"],
    ["Inventory Value (IDR)", analytics.inventory.inventoryValue, "Current inventory"],
    [
      "Estimated Unrealized Profit (IDR)",
      analytics.inventory.estimatedUnrealizedProfit,
      "Current estimate",
    ],
    ["Completed Sales", analytics.financial.completedSales, scope],
    ["Total Revenue (IDR)", analytics.financial.totalRevenue, scope],
    ["Cost of Goods Sold (IDR)", analytics.financial.costOfGoodsSold, scope],
    ["Total Additional Expenses (IDR)", analytics.financial.totalAdditionalExpenses, scope],
    ["Net Profit (IDR)", analytics.financial.netProfit, scope],
    ["Profit Margin (%)", analytics.financial.profitMargin ?? "N/A", scope],
    ["Return on Investment (%)", analytics.financial.returnOnInvestment ?? "N/A", scope],
    ["Average Profit per Sale (IDR)", analytics.financial.averageProfitPerSale ?? "N/A", scope],
    ["Average Selling Price (IDR)", analytics.financial.averageSellingPrice ?? "N/A", scope],
    ["Owner Capital (IDR)", analytics.capitalPosition.capital, "Capital and equity"],
    ["Retained Net Profit (IDR)", analytics.capitalPosition.retainedNetProfit, "All time"],
    ["Estimated Cash (IDR)", analytics.capitalPosition.estimatedCash, "Current estimate"],
    ["Estimated Equity (IDR)", analytics.capitalPosition.estimatedEquity, "Current estimate"],
  ] as const;
  return csvResponse("accstacks-financial-summary.csv", ["Metric", "Value", "Scope"], rows);
}
