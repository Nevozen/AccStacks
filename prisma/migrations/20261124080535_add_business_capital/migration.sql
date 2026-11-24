-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_listingId_accountId_fkey";

-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "capital" BIGINT;

ALTER TABLE "UserSettings"
ADD CONSTRAINT "UserSettings_capital_nonnegative" CHECK ("capital" IS NULL OR "capital" >= 0);

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_listingId_accountId_fkey"
FOREIGN KEY ("listingId", "accountId") REFERENCES "Listing"("id", "accountId")
ON DELETE RESTRICT ON UPDATE CASCADE;
