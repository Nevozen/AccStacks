export type EligibleAccountDto = {
  id: string;
  gameName: string;
  accountName: string;
  imageUrl: string | null;
  purchasePrice: string;
  activeListings: {
    id: string;
    marketplace: string;
    marketplaceNormalized: string;
    listingPrice: string;
  }[];
};

export type ListingDto = {
  id: string;
  marketplace: string;
  marketplaceNormalized: string;
  listingPrice: string;
  listingUrl: string | null;
  notes: string | null;
  listedAt: string;
  listedDateInput: string;
  daysListed: number;
  estimatedProfit: string;
  estimatedProfitMargin: string | null;
  estimatedRoi: string | null;
  account: EligibleAccountDto & {
    description: string | null;
    purchaseDate: string;
    activeListingCount: number;
  };
};
