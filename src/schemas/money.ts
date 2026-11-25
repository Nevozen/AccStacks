import { z } from "zod";
import { CURRENCIES, parseMoneyInput, type Currency } from "@/lib/money";

export const currencySchema = z.enum(CURRENCIES);

export function moneyInputSchema(currency: Currency) {
  return z
    .string()
    .trim()
    .refine(
      (value) => parseMoneyInput(value, currency) !== null,
      currency === "IDR"
        ? "Enter a valid whole Rupiah amount"
        : "Enter a valid US dollar amount with up to two decimals",
    );
}
