import { DateTime } from "luxon";
import { z } from "zod";
import type { Currency } from "@/lib/money";
import { moneyInputSchema } from "./money";

const settingsFields = z.object({
  timezone: z
    .string()
    .trim()
    .max(100)
    .refine((value) => DateTime.now().setZone(value).isValid, "Invalid timezone"),
  preferredStockView: z.enum(["GRID", "TABLE"]),
});

export function settingsInputSchema(currency: Currency) {
  return settingsFields.extend({ capital: moneyInputSchema(currency).optional() });
}

export type SettingsInput = z.infer<ReturnType<typeof settingsInputSchema>>;
