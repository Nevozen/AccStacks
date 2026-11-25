import { z } from "zod";
import type { Currency } from "@/lib/money";
import { moneyInputSchema } from "./money";

const optionalText = (max: number) => z.string().trim().max(max).optional();
const externalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid HTTPS listing URL");

const listingFields = z.object({
  accountId: z.string().trim().min(1, "Select an account").max(100),
  marketplace: z.string().trim().min(1, "Marketplace is required").max(100),
  listingUrl: z.union([z.literal(""), externalUrl]).optional(),
  listedAt: z.iso.date("Enter a valid listing date"),
  notes: optionalText(2000),
});

export function listingInputSchema(currency: Currency) {
  return listingFields.extend({ listingPrice: moneyInputSchema(currency) });
}

export type ListingInput = z.infer<ReturnType<typeof listingInputSchema>>;
export type UpdateListingInput = Omit<ListingInput, "accountId">;

export const listingQuerySchema = z.object({
  q: z.string().trim().max(150).default(""),
  game: z.string().trim().max(100).default(""),
  marketplace: z.string().trim().max(100).default(""),
  sort: z
    .enum(["newest", "oldest", "priceHigh", "priceLow", "profitHigh", "profitLow", "marketplace"])
    .default("newest"),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
});

export type ListingQuery = z.input<typeof listingQuerySchema>;
