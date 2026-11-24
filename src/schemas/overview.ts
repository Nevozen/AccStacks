import { z } from "zod";
import { DATE_RANGES } from "@/lib/dates";

export const overviewQuerySchema = z.object({
  range: z.enum(DATE_RANGES).default("last30"),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});

export type OverviewQuery = z.input<typeof overviewQuerySchema>;
