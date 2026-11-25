export const MAX_MONEY = 9_007_199_254_740_991n;
export const MIN_MONEY = -MAX_MONEY;

export const CURRENCIES = ["IDR", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const currencyDetails = {
  IDR: { name: "Indonesian rupiah", symbol: "Rp", region: "ID" },
  USD: { name: "US dollar", symbol: "$", region: "US" },
} as const;

const idrFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});
const usdWholeFormatter = new Intl.NumberFormat("en-US");
const compactFormatters = {
  IDR: new Intl.NumberFormat("id-ID", { notation: "compact", maximumFractionDigits: 1 }),
  USD: new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }),
};

export function assertSafeMoney(value: bigint) {
  if (value < MIN_MONEY || value > MAX_MONEY) {
    throw new RangeError("Monetary value exceeds the supported safe range");
  }
  return value;
}

export function parseMoneyInput(input: string, currency: Currency): bigint | null {
  const text = input.trim();
  const match = (currency === "USD" ? /^(\d{1,16})(?:\.(\d{1,2}))?$/ : /^(\d{1,16})$/).exec(text);
  if (!match) return null;
  const whole = BigInt(match[1]!);
  const amount =
    currency === "USD" ? whole * 100n + BigInt((match[2] ?? "").padEnd(2, "0")) : whole;
  return amount <= MAX_MONEY ? amount : null;
}

function splitCents(value: bigint) {
  const absolute = value < 0n ? -value : value;
  return { whole: absolute / 100n, cents: (absolute % 100n).toString().padStart(2, "0") };
}

export function moneyToDecimal(value: bigint, currency: Currency) {
  if (currency === "IDR") return value.toString();
  const { whole, cents } = splitCents(value);
  return `${value < 0n ? "-" : ""}${whole}.${cents}`;
}

export function formatMoney(value: bigint | number, currency: Currency = "IDR") {
  if (currency === "IDR") return idrFormatter.format(value).replace(/Rp\s+/u, "Rp");
  const { whole, cents } = splitCents(BigInt(value));
  return `${value < 0 ? "-" : ""}$${usdWholeFormatter.format(whole)}.${cents}`;
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

export function formatCompactMoney(value: bigint | number, currency: Currency) {
  const numericValue = typeof value === "bigint" ? toSafeNumber(value) : value;
  const magnitude = Math.abs(numericValue) / (currency === "USD" ? 100 : 1);
  return `${numericValue < 0 ? "-" : ""}${currencyDetails[currency].symbol}${compactFormatters[currency].format(magnitude)}`;
}
