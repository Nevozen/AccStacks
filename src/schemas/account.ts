import { z } from "zod";
import { isValidStoredImageId } from "@/lib/image-files";
import type { Currency } from "@/lib/money";
import { moneyInputSchema } from "./money";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid HTTPS URL");

const accountFields = z.object({
  gameName: z.string().trim().min(1, "Game name is required").max(100),
  accountName: z.string().trim().min(1, "Account name is required").max(150),
  description: optionalText(2000),
  imageUrl: z
    .union([
      z.literal(""),
      httpsUrl,
      z
        .string()
        .refine(
          (value) =>
            value.startsWith("/api/uploads/") &&
            isValidStoredImageId(value.slice("/api/uploads/".length)),
          "Invalid stored image path",
        ),
    ])
    .optional(),
  purchaseDate: z.iso.date("Enter a valid purchase date"),
  purchasedFrom: optionalText(200),
  notes: optionalText(2000),
});

export function accountInputSchema(currency: Currency) {
  return accountFields.extend({ purchasePrice: moneyInputSchema(currency) });
}

export type AccountInput = z.infer<ReturnType<typeof accountInputSchema>>;

export const stockQuerySchema = z.object({
  q: z.string().trim().max(150).default(""),
  game: z.string().trim().max(100).default(""),
  category: z.enum(["all", "available", "listed", "sold"]).default("all"),
  sort: z
    .enum([
      "statusName",
      "newest",
      "oldest",
      "purchaseHigh",
      "purchaseLow",
      "name",
      "saleNewest",
      "profitHigh",
      "profitLow",
    ])
    .default("statusName"),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  view: z.enum(["grid", "table"]).default("grid"),
});

export type StockQuery = z.input<typeof stockQuerySchema>;
