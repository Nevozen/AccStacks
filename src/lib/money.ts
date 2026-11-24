export const MAX_MONEY = 9_007_199_254_740_991n;
export const MIN_MONEY = -MAX_MONEY;

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function assertSafeMoney(value: bigint) {
  if (value < MIN_MONEY || value > MAX_MONEY) {
    throw new RangeError("Monetary value exceeds the supported safe range");
  }
  return value;
}

export function formatMoney(value: bigint | number) {
  return idrFormatter.format(value).replace(/Rp\s+/u, "Rp");
}

export function toSafeNumber(value: bigint) {
  assertSafeMoney(value);
  return Number(value);
}

export function moneyToDto(value: bigint) {
  return value.toString();
}

export function formatPercentage(value: string | null) {
  return value === null ? "N/A" : `${value}%`;
}

export function formatCompactMoney(value: bigint | number) {
  const numericValue = typeof value === "bigint" ? toSafeNumber(value) : value;
  return `Rp${new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(numericValue)}`;
}
