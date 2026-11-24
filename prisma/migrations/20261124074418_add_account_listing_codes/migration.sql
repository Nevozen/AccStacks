-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT IF EXISTS "Sale_listingId_accountId_fkey";

-- AlterTable
ALTER TABLE "Account" ADD COLUMN IF NOT EXISTS "accountCode" TEXT;
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "listingCode" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "GameCounter" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "gameNameNormalized" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "GameCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GameCounter_ownerId_gameNameNormalized_key" ON "GameCounter"("ownerId", "gameNameNormalized");
CREATE UNIQUE INDEX IF NOT EXISTS "GameCounter_ownerId_prefix_key" ON "GameCounter"("ownerId", "prefix");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'GameCounter_ownerId_fkey') THEN
    ALTER TABLE "GameCounter" ADD CONSTRAINT "GameCounter_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION accstacks_game_initials(value TEXT) RETURNS TEXT AS $$
DECLARE
  result TEXT DEFAULT '';
  word TEXT;
BEGIN
  FOREACH word IN ARRAY regexp_split_to_array(btrim(value), '\s+') LOOP
    result := result || upper(substr(word, 1, 1));
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION accstacks_suffix(value INTEGER) RETURNS TEXT AS $$
DECLARE
  result TEXT DEFAULT '';
  current INTEGER := value;
BEGIN
  WHILE current > 0 LOOP
    current := current - 1;
    result := chr(65 + (current % 26)) || result;
    current := current / 26;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

WITH games AS (
  SELECT DISTINCT "ownerId", "gameNameNormalized" FROM "Account"
), prefixes AS (
  SELECT
    "ownerId",
    "gameNameNormalized",
    accstacks_game_initials("gameNameNormalized") AS base,
    ROW_NUMBER() OVER (
      PARTITION BY "ownerId", accstacks_game_initials("gameNameNormalized")
      ORDER BY "gameNameNormalized"
    ) AS prefix_index
  FROM games
), resolved AS (
  SELECT
    "ownerId",
    "gameNameNormalized",
    base || CASE WHEN prefix_index = 1 THEN '' ELSE accstacks_suffix((prefix_index - 1)::integer) END AS prefix
  FROM prefixes
), numbered_accounts AS (
  SELECT
    a.id,
    a."ownerId",
    a."gameNameNormalized",
    r.prefix,
    ROW_NUMBER() OVER (
      PARTITION BY a."ownerId", a."gameNameNormalized"
      ORDER BY a."purchaseDate", a."createdAt", a.id
    ) AS sequence
  FROM "Account" a
  JOIN resolved r
    ON r."ownerId" = a."ownerId"
    AND r."gameNameNormalized" = a."gameNameNormalized"
), coded_accounts AS (
  SELECT id, prefix, sequence, prefix || sequence AS code
  FROM numbered_accounts
)
UPDATE "Account" a SET "accountCode" = c.code
FROM coded_accounts c WHERE a.id = c.id;

WITH numbered_listings AS (
  SELECT
    l.id,
    a."accountCode",
    ROW_NUMBER() OVER (
      PARTITION BY l."accountId"
      ORDER BY l."listedAt", l."createdAt", l.id
    ) AS sequence
  FROM "Listing" l
  JOIN "Account" a ON a.id = l."accountId"
)
UPDATE "Listing" l
SET "listingCode" = n."accountCode" || '-' || n.sequence
FROM numbered_listings n WHERE l.id = n.id;

WITH games AS (
  SELECT DISTINCT "ownerId", "gameNameNormalized" FROM "Account"
), prefixes AS (
  SELECT
    "ownerId",
    "gameNameNormalized",
    accstacks_game_initials("gameNameNormalized") AS base,
    ROW_NUMBER() OVER (
      PARTITION BY "ownerId", accstacks_game_initials("gameNameNormalized")
      ORDER BY "gameNameNormalized"
    ) AS prefix_index
  FROM games
), resolved AS (
  SELECT
    "ownerId",
    "gameNameNormalized",
    base || CASE WHEN prefix_index = 1 THEN '' ELSE accstacks_suffix((prefix_index - 1)::integer) END AS prefix
  FROM prefixes
), account_counts AS (
  SELECT
    "ownerId",
    "gameNameNormalized",
    COUNT(*) + 1 AS next_number
  FROM "Account"
  GROUP BY "ownerId", "gameNameNormalized"
)
INSERT INTO "GameCounter" (
  "id", "ownerId", "gameNameNormalized", "prefix", "nextNumber", "updatedAt"
)
SELECT
  md5(random()::text || clock_timestamp()::text || r."ownerId" || r."gameNameNormalized"),
  r."ownerId",
  r."gameNameNormalized",
  r.prefix,
  c.next_number,
  CURRENT_TIMESTAMP
FROM resolved r
JOIN account_counts c
  ON c."ownerId" = r."ownerId"
  AND c."gameNameNormalized" = r."gameNameNormalized";

ALTER TABLE "Account" ALTER COLUMN "accountCode" SET NOT NULL;
ALTER TABLE "Listing" ALTER COLUMN "listingCode" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Account_ownerId_accountCode_key" ON "Account"("ownerId", "accountCode");
CREATE UNIQUE INDEX IF NOT EXISTS "Listing_accountId_listingCode_key" ON "Listing"("accountId", "listingCode");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Sale_listingId_accountId_fkey') THEN
    ALTER TABLE "Sale"
    ADD CONSTRAINT "Sale_listingId_accountId_fkey"
    FOREIGN KEY ("listingId", "accountId") REFERENCES "Listing"("id", "accountId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DROP FUNCTION accstacks_suffix(INTEGER);
DROP FUNCTION accstacks_game_initials(TEXT);
