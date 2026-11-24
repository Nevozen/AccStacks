-- Ensure the successful listing always belongs to the sold account.
ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_listingId_accountId_fkey"
FOREIGN KEY ("listingId", "accountId") REFERENCES "Listing"("id", "accountId")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Monetary values are whole Rupiah and cannot be negative, except calculated profit.
ALTER TABLE "Account"
ADD CONSTRAINT "Account_purchasePrice_nonnegative" CHECK ("purchasePrice" >= 0);

ALTER TABLE "Listing"
ADD CONSTRAINT "Listing_listingPrice_nonnegative" CHECK ("listingPrice" >= 0);

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_purchasePrice_nonnegative" CHECK ("purchasePrice" >= 0),
ADD CONSTRAINT "Sale_originalListingPrice_nonnegative" CHECK ("originalListingPrice" >= 0),
ADD CONSTRAINT "Sale_sellingPrice_nonnegative" CHECK ("sellingPrice" >= 0),
ADD CONSTRAINT "Sale_totalExpenses_nonnegative" CHECK ("totalExpenses" >= 0),
ADD CONSTRAINT "Sale_netProfit_consistent" CHECK ("netProfit" = "sellingPrice" - "purchasePrice" - "totalExpenses");

ALTER TABLE "SaleExpense"
ADD CONSTRAINT "SaleExpense_amount_nonnegative" CHECK ("amount" >= 0);
