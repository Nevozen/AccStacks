import type { getAccountDetail, StockAccountRecord } from "@/services/accounts";
import { deriveAccountStatus } from "@/lib/account-status";
import { calculateHoldingDays, dateToInput } from "@/lib/dates";
import { calculatePercentage } from "@/lib/finance";
import type { AccountDetailDto, StockAccountDto } from "./types";

export function toStockAccountDto(account: StockAccountRecord, timezone: string): StockAccountDto {
  return {
    id: account.id,
    gameName: account.gameName,
    accountName: account.accountName,
    description: account.description,
    imageUrl: account.imageUrl,
    purchasePrice: account.purchasePrice.toString(),
    purchaseDate: account.purchaseDate.toISOString(),
    purchaseDateInput: dateToInput(account.purchaseDate, timezone),
    purchasedFrom: account.purchasedFrom,
    notes: account.notes,
    status: deriveAccountStatus({
      sold: Boolean(account.sale),
      activeListingCount: account._count.listings,
    }),
    activeListingCount: account._count.listings,
    sale: account.sale
      ? { netProfit: account.sale.netProfit.toString(), soldAt: account.sale.soldAt.toISOString() }
      : null,
  };
}

export function toAccountDetailDto(
  account: Awaited<ReturnType<typeof getAccountDetail>>,
  timezone: string,
): AccountDetailDto {
  return {
    ...toStockAccountDto(account, timezone),
    createdAt: account.createdAt.toISOString(),
    holdingDays: calculateHoldingDays(
      account.purchaseDate,
      account.sale?.soldAt ?? new Date(),
      timezone,
    ),
    listings: account.listings.map((listing) => ({
      id: listing.id,
      marketplace: listing.marketplace,
      listingPrice: listing.listingPrice.toString(),
      listingUrl: listing.listingUrl,
      notes: listing.notes,
      status: listing.status,
      listedAt: listing.listedAt.toISOString(),
      closedAt: listing.closedAt?.toISOString() ?? null,
    })),
    sale: account.sale
      ? {
          id: account.sale.id,
          marketplace: account.sale.marketplace,
          purchasePrice: account.sale.purchasePrice.toString(),
          originalListingPrice: account.sale.originalListingPrice.toString(),
          sellingPrice: account.sale.sellingPrice.toString(),
          totalExpenses: account.sale.totalExpenses.toString(),
          netProfit: account.sale.netProfit.toString(),
          profitMargin: calculatePercentage(account.sale.netProfit, account.sale.sellingPrice),
          roi: calculatePercentage(account.sale.netProfit, account.sale.purchasePrice),
          soldAt: account.sale.soldAt.toISOString(),
          notes: account.sale.notes,
          expenses: account.sale.expenses.map((expense) => ({
            id: expense.id,
            name: expense.name,
            amount: expense.amount.toString(),
          })),
        }
      : null,
  };
}
