import { z } from "zod";
import type { Currency } from "@/lib/money";
import { moneyInputSchema } from "./money";

const saleFields = z.object({
  listingId: z.string().trim().min(1).max(100),
  soldAt: z.iso.date("Enter a valid sale date"),
  notes: z.string().trim().max(2000).optional(),
});

export function saleInputSchema(currency: Currency) {
  const amount = moneyInputSchema(currency);
  const expense = z.object({
    name: z.string().trim().min(1, "Expense description is required").max(150),
    amount,
  });
  return saleFields.extend({
    sellingPrice: amount,
    expenses: z.array(expense).max(50, "A sale can have at most 50 expenses"),
  });
}

export type SaleInput = z.infer<ReturnType<typeof saleInputSchema>>;
