import type { AccountStatus } from "@/lib/account-status";
import type { ListingStatus } from "@/generated/prisma/client";

export type StockAccountDto = {
  id: string;
  gameName: string;
  accountName: string;
  description: string | null;
  imageUrl: string | null;
  purchasePrice: string;
  purchaseDate: string;
  purchaseDateInput: string;
  purchasedFrom: string | null;
  notes: string | null;
  status: AccountStatus;
  activeListingCount: number;
  sale: { netProfit: string; soldAt: string } | null;
};

export type AccountDetailDto = Omit<StockAccountDto, "sale"> & {
  createdAt: string;
  holdingDays: number;
  listings: {
    id: string;
    marketplace: string;
    listingPrice: string;
    listingUrl: string | null;
    notes: string | null;
    status: ListingStatus;
    listedAt: string;
    closedAt: string | null;
  }[];
  sale: {
    id: string;
    marketplace: string;
    purchasePrice: string;
    originalListingPrice: string;
    sellingPrice: string;
    totalExpenses: string;
    netProfit: string;
    profitMargin: string | null;
    roi: string | null;
    soldAt: string;
    notes: string | null;
    expenses: { id: string; name: string; amount: string }[];
  } | null;
};

export type StockCounts = { all: number; available: number; listed: number; sold: number };
