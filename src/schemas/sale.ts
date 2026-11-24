import { z } from "zod";
import { moneyInputSchema } from "./account";

export const saleExpenseInputSchema = z.object({
  name: z.string().trim().min(1, "Expense description is required").max(150),
  amount: moneyInputSchema,
});

export const saleInputSchema = z.object({
  listingId: z.string().trim().min(1).max(100),
  sellingPrice: moneyInputSchema,
  soldAt: z.iso.date("Enter a valid sale date"),
  notes: z.string().trim().max(2000).optional(),
  expenses: z.array(saleExpenseInputSchema).max(50, "A sale can have at most 50 expenses"),
});

export type SaleInput = z.infer<typeof saleInputSchema>;
export type SaleExpenseInput = z.infer<typeof saleExpenseInputSchema>;
