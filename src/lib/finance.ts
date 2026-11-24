import { assertSafeMoney } from "./money";

function absolute(value: bigint) {
  return value < 0n ? -value : value;
}

function roundedFraction(numerator: bigint, denominator: bigint) {
  const negative = numerator < 0n !== denominator < 0n;
  const result = (absolute(numerator) + absolute(denominator) / 2n) / absolute(denominator);
  return negative ? -result : result;
}

export function calculatePercentage(
  numerator: bigint,
  denominator: bigint,
  fractionDigits = 2,
): string | null {
  if (denominator === 0n) return null;
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 6) {
    throw new RangeError("Percentage fraction digits must be between 0 and 6");
  }

  const scale = 10n ** BigInt(fractionDigits);
  const scaled = roundedFraction(numerator * 100n * scale, denominator);
  const negative = scaled < 0n;
  const magnitude = absolute(scaled);
  const whole = magnitude / scale;
  const fraction = (magnitude % scale).toString().padStart(fractionDigits, "0");
  const sign = negative && magnitude > 0n ? "-" : "";

  return fractionDigits === 0
    ? `${sign}${whole}`
    : `${sign}${whole}.${fraction.slice(-fractionDigits)}`;
}

export function sumExpenses(amounts: readonly bigint[]) {
  return amounts.reduce((total, amount) => {
    if (amount < 0n) throw new RangeError("Expense amounts cannot be negative");
    return assertSafeMoney(total + amount);
  }, 0n);
}

export function calculateEstimatedProfit(listingPrice: bigint, purchasePrice: bigint) {
  return assertSafeMoney(listingPrice - purchasePrice);
}

export function calculateNetProfit({
  sellingPrice,
  purchasePrice,
  expenses,
}: {
  sellingPrice: bigint;
  purchasePrice: bigint;
  expenses: readonly bigint[];
}) {
  return assertSafeMoney(sellingPrice - purchasePrice - sumExpenses(expenses));
}

export function calculateSaleMetrics(input: {
  sellingPrice: bigint;
  purchasePrice: bigint;
  expenses: readonly bigint[];
}) {
  const totalExpenses = sumExpenses(input.expenses);
  const netProfit = calculateNetProfit(input);

  return {
    totalExpenses,
    netProfit,
    profitMargin: calculatePercentage(netProfit, input.sellingPrice),
    roi: calculatePercentage(netProfit, input.purchasePrice),
  };
}

export function calculateListingMetrics({
  listingPrice,
  purchasePrice,
}: {
  listingPrice: bigint;
  purchasePrice: bigint;
}) {
  const estimatedProfit = calculateEstimatedProfit(listingPrice, purchasePrice);
  return {
    estimatedProfit,
    estimatedProfitMargin: calculatePercentage(estimatedProfit, listingPrice),
    estimatedRoi: calculatePercentage(estimatedProfit, purchasePrice),
  };
}

export function calculateAverage(total: bigint, count: number) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError("Invalid item count");
  return count === 0 ? null : roundedFraction(total, BigInt(count));
}

export function calculateUnrealizedProfit(
  accounts: readonly { purchasePrice: bigint; activeListingPrices: readonly bigint[] }[],
) {
  return accounts.reduce((total, account) => {
    if (account.activeListingPrices.length === 0) return total;
    const representativePrice = account.activeListingPrices.reduce((highest, price) =>
      price > highest ? price : highest,
    );
    return assertSafeMoney(total + representativePrice - account.purchasePrice);
  }, 0n);
}
