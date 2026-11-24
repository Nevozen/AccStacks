export function normalizeName(value: string) {
  return value.trim().replace(/\s+/gu, " ");
}

export function normalizeCategory(value: string) {
  return normalizeName(value).toLocaleLowerCase("en-US");
}

export const DEFAULT_MARKETPLACES = [
  "Instagram",
  "Facebook",
  "Shopee",
  "Itemku",
  "Discord",
  "Telegram",
  "WhatsApp",
] as const;
