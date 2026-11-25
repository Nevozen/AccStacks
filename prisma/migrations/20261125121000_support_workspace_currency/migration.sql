-- Existing IDR workspaces keep their currency and all monetary amounts.
ALTER TABLE "UserSettings"
  ALTER COLUMN "currency" DROP NOT NULL,
  ADD CONSTRAINT "UserSettings_supported_currency" CHECK ("currency" IN ('IDR', 'USD'));
