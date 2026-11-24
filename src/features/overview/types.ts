export type ChartPoint = {
  period: string;
  label: string;
  sales: number;
  revenue: number;
  netProfit: number;
  revenueText: string;
  netProfitText: string;
};

export type PerformancePoint = {
  name: string;
  sales: number;
  revenue: number;
  netProfit: number;
  revenueText: string;
  netProfitText: string;
};

export type OverviewDto = {
  query: { range: string; from: string; to: string };
  inventory: {
    totalAccounts: number;
    availableAccounts: number;
    listedAccounts: number;
    soldAccounts: number;
    activeListings: number;
    inventoryValue: string;
    estimatedUnrealizedProfit: string;
  };
  financial: {
    completedSales: number;
    totalRevenue: string;
    costOfGoodsSold: string;
    totalAdditionalExpenses: string;
    netProfit: string;
    profitMargin: string | null;
    returnOnInvestment: string | null;
    averageProfitPerSale: string | null;
    averageSellingPrice: string | null;
  };
  trends: ChartPoint[];
  monthlySales: ChartPoint[];
  gamePerformance: PerformancePoint[];
  marketplacePerformance: PerformancePoint[];
  holdingPeriod: { name: string; averageDays: number }[];
  recentSales: {
    id: string;
    accountId: string;
    accountName: string;
    gameName: string;
    marketplace: string;
    purchasePrice: string;
    sellingPrice: string;
    totalExpenses: string;
    netProfit: string;
    soldAt: string;
  }[];
};
