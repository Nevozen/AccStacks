-- Cancelled rows keep their original codes and internal IDs for history.
BEGIN;

CREATE UNIQUE INDEX "Listing_live_code_key"
ON "Listing" ("accountId", "listingCode")
WHERE "status" <> 'CANCELLED'::"ListingStatus";

DROP INDEX "Listing_accountId_listingCode_key";

COMMIT;
