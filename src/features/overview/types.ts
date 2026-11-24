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

export type ChangeDto = {
  value: string | null;
  direction: "up" | "down" | "steady" | "new";
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
  comparison: {
    label: string | null;
    revenue: ChangeDto;
    netProfit: ChangeDto;
    sales: ChangeDto;
  };
  capitalPosition: {
    capital: string;
    retainedNetProfit: string;
    estimatedEquity: string;
    estimatedCash: string;
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
