-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_listingId_accountId_fkey";

-- AlterTable
ALTER TABLE "UserSettings" ALTER COLUMN "theme" SET DEFAULT 'LIGHT';

UPDATE "UserSettings" SET "theme" = 'LIGHT' WHERE "theme" = 'SYSTEM';

ALTER TABLE "Sale"
ADD CONSTRAINT "Sale_listingId_accountId_fkey"
FOREIGN KEY ("listingId", "accountId") REFERENCES "Listing"("id", "accountId")
ON DELETE RESTRICT ON UPDATE CASCADE;
