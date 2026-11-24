export const ACCOUNT_STATUSES = ["AVAILABLE", "LISTED", "SOLD"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export function deriveAccountStatus({
  sold,
  activeListingCount,
}: {
  sold: boolean;
  activeListingCount: number;
}): AccountStatus {
  if (sold) return "SOLD";
  return activeListingCount > 0 ? "LISTED" : "AVAILABLE";
}
