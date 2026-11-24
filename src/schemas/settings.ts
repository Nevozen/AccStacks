import { DateTime } from "luxon";
import { z } from "zod";

export const settingsInputSchema = z.object({
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]),
  timezone: z
    .string()
    .trim()
    .max(100)
    .refine((value) => DateTime.now().setZone(value).isValid, "Invalid timezone"),
  currency: z.literal("IDR"),
  preferredStockView: z.enum(["GRID", "TABLE"]),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
